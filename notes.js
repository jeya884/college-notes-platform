const express = require('express');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all notes with search and filter
router.get('/', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let sql = 'SELECT n.*, u.name as uploader_name FROM notes n JOIN users u ON n.uploader_id = u.id WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (n.title LIKE ? OR n.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      sql += ' AND n.category = ?';
      params.push(category);
    }

    if (sort === 'rating') {
      sql += ' ORDER BY n.average_rating DESC';
    } else if (sort === 'downloads') {
      sql += ' ORDER BY n.download_count DESC';
    } else {
      sql += ' ORDER BY n.created_at DESC';
    }

    const notes = await query(sql, params);
    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const notes = await query(
      'SELECT n.*, u.name as uploader_name FROM notes n JOIN users u ON n.uploader_id = u.id WHERE n.id = ?',
      [req.params.id]
    );

    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(notes[0]);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Upload new note
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, category, courseCode } = req.body;

    if (!title || !category) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const result = await query(
      'INSERT INTO notes (title, description, category, course_code, uploader_id, file_path, file_size, file_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || null, category, courseCode || null, req.user.id, req.file.path, req.file.size, req.file.filename]
    );

    res.status(201).json({
      message: 'Note uploaded successfully',
      noteId: result.insertId,
      note: {
        id: result.insertId,
        title,
        description,
        category,
        courseCode,
        file_name: req.file.filename
      }
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Download note
router.get('/:id/download', async (req, res) => {
  try {
    const notes = await query('SELECT * FROM notes WHERE id = ?', [req.params.id]);

    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = notes[0];
    const filePath = note.file_path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Increment download count
    await query('UPDATE notes SET download_count = download_count + 1 WHERE id = ?', [req.params.id]);

    // Record download if user is logged in
    if (req.query.userId) {
      await query(
        'INSERT INTO downloads (note_id, user_id) VALUES (?, ?)',
        [req.params.id, req.query.userId]
      ).catch(() => {}); // Ignore error if download already recorded
    }

    res.download(filePath, note.file_name);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Rate note
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Insert or update rating
    await query(
      'INSERT INTO ratings (note_id, user_id, rating) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = ?',
      [req.params.id, req.user.id, rating, rating]
    );

    // Update average rating
    const ratings = await query('SELECT AVG(rating) as avg_rating FROM ratings WHERE note_id = ?', [req.params.id]);
    const avgRating = ratings[0].avg_rating || 0;

    await query('UPDATE notes SET average_rating = ? WHERE id = ?', [avgRating, req.params.id]);

    res.json({ message: 'Rating recorded', averageRating: avgRating });
  } catch (error) {
    console.error('Rate error:', error);
    res.status(500).json({ error: 'Failed to record rating' });
  }
});

// Add to favorites
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'INSERT INTO favorites (user_id, note_id) VALUES (?, ?)',
      [req.user.id, req.params.id]
    );

    res.status(201).json({ message: 'Added to favorites' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Already in favorites' });
    }
    console.error('Favorite error:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove from favorites
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM favorites WHERE user_id = ? AND note_id = ?', [req.user.id, req.params.id]);
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Delete note (own or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notes = await query('SELECT * FROM notes WHERE id = ?', [req.params.id]);

    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = notes[0];

    // Check if user is owner or admin
    if (note.uploader_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete file
    if (fs.existsSync(note.file_path)) {
      fs.unlinkSync(note.file_path);
    }

    // Delete from database
    await query('DELETE FROM notes WHERE id = ?', [req.params.id]);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Get user's downloads
router.get('/user/downloads', authenticateToken, async (req, res) => {
  try {
    const downloads = await query(
      'SELECT n.*, u.name as uploader_name FROM downloads d JOIN notes n ON d.note_id = n.id JOIN users u ON n.uploader_id = u.id WHERE d.user_id = ? ORDER BY d.created_at DESC',
      [req.user.id]
    );
    res.json(downloads);
  } catch (error) {
    console.error('Get downloads error:', error);
    res.status(500).json({ error: 'Failed to fetch downloads' });
  }
});

// Get user's favorites
router.get('/user/favorites', authenticateToken, async (req, res) => {
  try {
    const favorites = await query(
      'SELECT n.*, u.name as uploader_name FROM favorites f JOIN notes n ON f.note_id = n.id JOIN users u ON n.uploader_id = u.id WHERE f.user_id = ? ORDER BY f.created_at DESC',
      [req.user.id]
    );
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get user's uploads
router.get('/user/uploads', authenticateToken, async (req, res) => {
  try {
    const uploads = await query(
      'SELECT * FROM notes WHERE uploader_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(uploads);
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

module.exports = router;
