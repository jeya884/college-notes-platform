const express = require('express');
const { getDb, saveDb } = require('../config/database');
const { syncDocToFirestore, deleteDocFromFirestore } = require('../config/firebase');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// GET all assignments (Filter by Year, Semester, Subject, Status)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { year, semester, subject, status, search } = req.query;

    let assignments = [...db.assignments];

    if (year && year !== 'all') {
      assignments = assignments.filter(a => a.year && a.year.toLowerCase() === year.toLowerCase());
    }

    if (semester && semester !== 'all') {
      assignments = assignments.filter(a => a.semester && a.semester.toLowerCase() === semester.toLowerCase());
    }

    if (subject && subject !== 'all') {
      assignments = assignments.filter(a => a.subject && a.subject.toLowerCase() === subject.toLowerCase());
    }

    if (status && status !== 'all') {
      assignments = assignments.filter(a => a.status && a.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase().trim();
      assignments = assignments.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.subject && a.subject.toLowerCase().includes(q)) ||
        (a.faculty && a.faculty.toLowerCase().includes(q))
      );
    }

    assignments.sort((a, b) => new Date(a.due_date || '9999').getTime() - new Date(b.due_date || '9999').getTime());

    res.json(assignments);
  } catch (error) {
    console.error('Fetch assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// GET single assignment
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const assignment = db.assignments.find(a => String(a.id) === String(req.params.id));
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// ADMIN ONLY: Create assignment
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const { title, subject, faculty, year, semester, due_date, max_marks, status, description, submission_info } = req.body;

    if (!title || !subject || !due_date) {
      return res.status(400).json({ error: 'Title, Subject, and Due Date are required' });
    }

    const assignedYear = year || (semester === 'Semester 3' || semester === 'Semester 4' ? 'Year 2' : 'Year 1');
    const assignedSem = semester || 'Semester 2';

    const nextId = db.nextIds.assignments++;
    const newAssignment = {
      id: nextId,
      title: title.trim(),
      subject: subject.trim(),
      faculty: (faculty || 'Faculty In-Charge').trim(),
      year: assignedYear,
      semester: assignedSem,
      due_date: due_date.trim(),
      max_marks: Number(max_marks) || 25,
      status: status || 'Open',
      description: (description || '').trim(),
      submission_info: (submission_info || 'Submit through college LMS or to subject professor.').trim(),
      created_at: new Date().toISOString()
    };

    db.assignments.unshift(newAssignment);
    saveDb();

    // Sync to Firebase Firestore
    await syncDocToFirestore('assignments', newAssignment.id, newAssignment);

    res.status(201).json({
      message: 'Assignment published and saved to Firebase Firestore',
      assignment: newAssignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// ADMIN ONLY: Edit assignment
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const assignment = db.assignments.find(a => String(a.id) === String(req.params.id));

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const { title, subject, faculty, year, semester, due_date, max_marks, status, description, submission_info } = req.body;

    if (title) assignment.title = title.trim();
    if (subject) assignment.subject = subject.trim();
    if (faculty !== undefined) assignment.faculty = faculty.trim();
    if (year !== undefined) assignment.year = year.trim();
    if (semester !== undefined) assignment.semester = semester.trim();
    if (due_date) assignment.due_date = due_date.trim();
    if (max_marks !== undefined) assignment.max_marks = Number(max_marks);
    if (status !== undefined) assignment.status = status.trim();
    if (description !== undefined) assignment.description = description.trim();
    if (submission_info !== undefined) assignment.submission_info = submission_info.trim();
    assignment.updated_at = new Date().toISOString();

    saveDb();

    // Update in Firebase Firestore
    await syncDocToFirestore('assignments', assignment.id, assignment);

    res.json({ message: 'Assignment updated in Firebase Firestore', assignment });
  } catch (error) {
    console.error('Edit assignment error:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// ADMIN ONLY: Delete assignment
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const index = db.assignments.findIndex(a => String(a.id) === String(req.params.id));

    if (index === -1) return res.status(404).json({ error: 'Assignment not found' });

    const assignment = db.assignments[index];
    db.assignments.splice(index, 1);
    saveDb();

    // Delete from Firebase Firestore
    await deleteDocFromFirestore('assignments', assignment.id);

    res.json({ message: 'Assignment deleted from Firebase Firestore' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;
