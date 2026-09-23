const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDb, saveDb, UPLOADS_DIR, getYearAndSemesterFromRoll } = require('../config/database');
const { syncDocToFirestore, deleteDocFromFirestore } = require('../config/firebase');
const { authenticateToken, optionalAuthenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET all notes (Filtered by Year, Semester, Subject, Search, and strictly by Student Roll No / User ID)
router.get('/', optionalAuthenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { search, subject, year, semester, sort, studentRoll, rollNumber, userId } = req.query;

    let notes = [...db.notes];

    // Determine if requester is a student (either from JWT token or studentRoll/userId query)
    let studentYear = null;
    let studentCohort = null;

    if (req.user && req.user.role === 'student') {
      studentCohort = getYearAndSemesterFromRoll(req.user.rollNumber || req.user.id);
      studentYear = studentCohort.year;
    } else if (studentRoll || rollNumber || userId) {
      studentCohort = getYearAndSemesterFromRoll(studentRoll || rollNumber || userId);
      studentYear = studentCohort.year;
    }

    // STRICT STUDENT FILTER: If student, lock the view exclusively to their year (roll-no-wise only)
    let targetYear = year;
    if (studentYear) {
      targetYear = studentYear; // Students can ONLY see their assigned cohort year
    }

    // Filter by Year ("Year 1" or "Year 2")
    if (targetYear && targetYear !== 'all') {
      notes = notes.filter(n => n.year && n.year.toLowerCase() === targetYear.toLowerCase());
    }

    // Filter by Semester ("Semester 1", "Semester 2", "Semester 3", "Semester 4")
    if (semester && semester !== 'all') {
      notes = notes.filter(n => n.semester && n.semester.toLowerCase() === semester.toLowerCase());
    }

    // Filter by Subject
    if (subject && subject !== 'all') {
      notes = notes.filter(n => n.subject && n.subject.toLowerCase() === subject.toLowerCase());
    }

    // Filter by Search Query
    if (search) {
      const q = search.toLowerCase().trim();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.description && n.description.toLowerCase().includes(q)) ||
        (n.subject && n.subject.toLowerCase().includes(q)) ||
        (n.course_code && n.course_code.toLowerCase().includes(q))
      );
    }

    if (sort === 'downloads') {
      notes.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    } else {
      notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    res.json(notes);
  } catch (error) {
    console.error('Fetch notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET single note
router.get('/:id', optionalAuthenticateToken, (req, res) => {
  try {
    const db = getDb();
    const note = db.notes.find(n => String(n.id) === String(req.params.id));
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // If student, ensure the note belongs to their year
    if (req.user && req.user.role === 'student') {
      const cohort = getYearAndSemesterFromRoll(req.user.rollNumber || req.user.id);
      if (note.year && note.year.toLowerCase() !== cohort.year.toLowerCase()) {
        return res.status(403).json({ error: `Access restricted. This note belongs to ${note.year}, but your Roll Number is registered in ${cohort.year}.` });
      }
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Download note file
router.get('/:id/download', optionalAuthenticateToken, (req, res) => {
  try {
    const db = getDb();
    const note = db.notes.find(n => String(n.id) === String(req.params.id));

    if (!note) return res.status(404).json({ error: 'Note not found' });

    // If student, enforce roll-no-wise year access
    if (req.user && req.user.role === 'student') {
      const cohort = getYearAndSemesterFromRoll(req.user.rollNumber || req.user.id);
      if (note.year && note.year.toLowerCase() !== cohort.year.toLowerCase()) {
        return res.status(403).json({ error: `Download restricted. This note belongs to ${note.year}, but your Roll Number is registered in ${cohort.year}.` });
      }
    }

    note.download_count = (note.download_count || 0) + 1;
    saveDb();
    syncDocToFirestore('notes', note.id, note);

    const filePath = note.file_path || path.join(UPLOADS_DIR, note.file_name);
    if (fs.existsSync(filePath)) {
      return res.download(filePath, note.file_name || `${note.title}.pdf`);
    }

    const fallbackContent = `%PDF-1.4\n% MBA ${note.year || 'Year 1'} ${note.semester || 'Semester 2'}\nTitle: ${note.title}\nSubject: ${note.subject}\nDescription: ${note.description}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${note.file_name || 'mba_notes.pdf'}"`);
    return res.send(fallbackContent);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// ADMIN ONLY: Upload new note (Stores in Firebase Firestore)
router.post('/', authenticateToken, authorizeRole('admin'), upload.single('file'), async (req, res) => {
  try {
    const { title, subject, course_code, year, semester, description } = req.body;
    const db = getDb();

    if (!title || !subject) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Title and Subject are required' });
    }

    let fileName = '';
    let filePath = '';
    let fileSize = 0;

    if (req.file) {
      fileName = req.file.filename;
      filePath = req.file.path;
      fileSize = req.file.size;
    } else {
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      fileName = `note_${cleanTitle}_${Date.now()}.pdf`;
      filePath = path.join(UPLOADS_DIR, fileName);
      const content = `%PDF-1.4\n% MBA Study Notes\nTitle: ${title}\nSubject: ${subject}\nAcademic Year: ${year || 'Year 1'}\nSemester: ${semester || 'Semester 2'}\n${description || ''}`;
      fs.writeFileSync(filePath, content, 'utf-8');
      fileSize = Buffer.byteLength(content);
    }

    const assignedYear = year || (semester === 'Semester 3' || semester === 'Semester 4' ? 'Year 2' : 'Year 1');
    const assignedSem = semester || 'Semester 2';

    const nextId = db.nextIds.notes++;
    const newNote = {
      id: nextId,
      title: title.trim(),
      subject: subject.trim(),
      course_code: (course_code || '').trim(),
      year: assignedYear,
      semester: assignedSem,
      description: (description || '').trim(),
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      download_count: 0,
      uploaded_by: req.user.name || 'Admin',
      created_at: new Date().toISOString()
    };

    db.notes.unshift(newNote);
    saveDb();

    // Store directly in Firebase Firestore
    await syncDocToFirestore('notes', newNote.id, newNote);

    res.status(201).json({
      message: 'MBA Note uploaded and synced to Firebase Firestore',
      note: newNote
    });
  } catch (error) {
    console.error('Note upload error:', error);
    res.status(500).json({ error: 'Failed to upload note: ' + error.message });
  }
});

// ADMIN ONLY: Edit note
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const note = db.notes.find(n => String(n.id) === String(req.params.id));

    if (!note) return res.status(404).json({ error: 'Note not found' });

    const { title, subject, course_code, year, semester, description } = req.body;

    if (title) note.title = title.trim();
    if (subject) note.subject = subject.trim();
    if (course_code !== undefined) note.course_code = course_code.trim();
    if (year !== undefined) note.year = year.trim();
    if (semester !== undefined) note.semester = semester.trim();
    if (description !== undefined) note.description = description.trim();
    note.updated_at = new Date().toISOString();

    saveDb();

    // Update in Firebase Firestore
    await syncDocToFirestore('notes', note.id, note);

    res.json({ message: 'Note updated in Firebase Firestore', note });
  } catch (error) {
    console.error('Edit note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// ADMIN ONLY: Delete note
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const index = db.notes.findIndex(n => String(n.id) === String(req.params.id));

    if (index === -1) return res.status(404).json({ error: 'Note not found' });

    const note = db.notes[index];
    if (note.file_path && fs.existsSync(note.file_path)) {
      try { fs.unlinkSync(note.file_path); } catch (e) {}
    }

    db.notes.splice(index, 1);
    saveDb();

    // Delete from Firebase Firestore
    await deleteDocFromFirestore('notes', note.id);

    res.json({ message: 'Note deleted from database and Firebase Firestore' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
