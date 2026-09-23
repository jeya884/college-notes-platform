const express = require('express');
const { getDb, saveDb } = require('../config/database');
const { syncDocToFirestore, deleteDocFromFirestore } = require('../config/firebase');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// GET announcements
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { category, priority, year } = req.query;

    let list = [...db.announcements];

    if (year && year !== 'all') {
      list = list.filter(a => !a.year || a.year === 'All Years' || a.year.toLowerCase() === year.toLowerCase());
    }

    if (category && category !== 'all') {
      list = list.filter(a => a.category.toLowerCase() === category.toLowerCase());
    }

    if (priority && priority !== 'all') {
      list = list.filter(a => a.priority.toLowerCase() === priority.toLowerCase());
    }

    list.sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());

    res.json(list);
  } catch (error) {
    console.error('Fetch announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// ADMIN ONLY: Post announcement
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const { title, content, category, priority, year, author } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const nextId = db.nextIds.announcements++;
    const newNotice = {
      id: nextId,
      title: title.trim(),
      content: content.trim(),
      category: (category || 'Academic').trim(),
      priority: (priority || 'normal').trim(),
      year: (year || 'All Years').trim(),
      author: (author || 'MBA Academic Office').trim(),
      date: new Date().toISOString().split('T')[0]
    };

    db.announcements.unshift(newNotice);
    saveDb();

    // Sync to Firebase Firestore
    await syncDocToFirestore('announcements', newNotice.id, newNotice);

    res.status(201).json({
      message: 'Notice posted and synced to Firebase Firestore',
      announcement: newNotice
    });
  } catch (error) {
    console.error('Post announcement error:', error);
    res.status(500).json({ error: 'Failed to post announcement' });
  }
});

// ADMIN ONLY: Edit announcement
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const notice = db.announcements.find(a => String(a.id) === String(req.params.id));

    if (!notice) return res.status(404).json({ error: 'Announcement not found' });

    const { title, content, category, priority, year, author } = req.body;

    if (title) notice.title = title.trim();
    if (content) notice.content = content.trim();
    if (category) notice.category = category.trim();
    if (priority) notice.priority = priority.trim();
    if (year !== undefined) notice.year = year.trim();
    if (author) notice.author = author.trim();

    saveDb();

    // Update in Firebase Firestore
    await syncDocToFirestore('announcements', notice.id, notice);

    res.json({ message: 'Announcement updated in Firebase Firestore', announcement: notice });
  } catch (error) {
    console.error('Edit announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// ADMIN ONLY: Delete announcement
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const index = db.announcements.findIndex(a => String(a.id) === String(req.params.id));

    if (index === -1) return res.status(404).json({ error: 'Announcement not found' });

    const notice = db.announcements[index];
    db.announcements.splice(index, 1);
    saveDb();

    // Delete from Firebase Firestore
    await deleteDocFromFirestore('announcements', notice.id);

    res.json({ message: 'Announcement deleted from Firebase Firestore' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
