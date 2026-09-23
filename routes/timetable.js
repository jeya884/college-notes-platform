const express = require('express');
const { getDb, saveDb } = require('../config/database');
const { syncDocToFirestore, deleteDocFromFirestore } = require('../config/firebase');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// GET timetable (Filtered by Day, Year, Semester)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { day, year, semester } = req.query;

    let timetable = [...db.timetable];

    if (day && day !== 'all') {
      timetable = timetable.filter(t => t.day.toLowerCase() === day.toLowerCase());
    }

    if (year && year !== 'all') {
      timetable = timetable.filter(t => t.year && t.year.toLowerCase() === year.toLowerCase());
    }

    if (semester && semester !== 'all') {
      timetable = timetable.filter(t => t.semester && t.semester.toLowerCase() === semester.toLowerCase());
    }

    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
    timetable.sort((a, b) => {
      const dDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
      if (dDiff !== 0) return dDiff;
      return a.time.localeCompare(b.time);
    });

    res.json(timetable);
  } catch (error) {
    console.error('Fetch timetable error:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// ADMIN ONLY: Add timetable slot
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const { day, time, year, semester, subject, course_code, faculty, room } = req.body;

    if (!day || !time || !subject) {
      return res.status(400).json({ error: 'Day, Time, and Subject are required' });
    }

    const assignedYear = year || (semester === 'Semester 3' || semester === 'Semester 4' ? 'Year 2' : 'Year 1');
    const assignedSem = semester || 'Semester 2';

    const nextId = db.nextIds.timetable++;
    const newSlot = {
      id: nextId,
      day: day.trim(),
      time: time.trim(),
      year: assignedYear,
      semester: assignedSem,
      subject: subject.trim(),
      course_code: (course_code || 'MBA').trim(),
      faculty: (faculty || 'Faculty Member').trim(),
      room: (room || 'Main Hall').trim()
    };

    db.timetable.push(newSlot);
    saveDb();

    // Sync to Firebase Firestore
    await syncDocToFirestore('timetable', newSlot.id, newSlot);

    res.status(201).json({
      message: 'Timetable class slot added and synced to Firebase Firestore',
      slot: newSlot
    });
  } catch (error) {
    console.error('Create timetable slot error:', error);
    res.status(500).json({ error: 'Failed to add timetable slot' });
  }
});

// ADMIN ONLY: Edit timetable slot
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const slot = db.timetable.find(t => String(t.id) === String(req.params.id));

    if (!slot) return res.status(404).json({ error: 'Timetable slot not found' });

    const { day, time, year, semester, subject, course_code, faculty, room } = req.body;

    if (day) slot.day = day.trim();
    if (time) slot.time = time.trim();
    if (year !== undefined) slot.year = year.trim();
    if (semester !== undefined) slot.semester = semester.trim();
    if (subject) slot.subject = subject.trim();
    if (course_code !== undefined) slot.course_code = course_code.trim();
    if (faculty !== undefined) slot.faculty = faculty.trim();
    if (room !== undefined) slot.room = room.trim();

    saveDb();

    // Update in Firebase Firestore
    await syncDocToFirestore('timetable', slot.id, slot);

    res.json({ message: 'Timetable slot updated in Firebase Firestore', slot });
  } catch (error) {
    console.error('Edit timetable slot error:', error);
    res.status(500).json({ error: 'Failed to update timetable slot' });
  }
});

// ADMIN ONLY: Delete timetable slot
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const index = db.timetable.findIndex(t => String(t.id) === String(req.params.id));

    if (index === -1) return res.status(404).json({ error: 'Timetable slot not found' });

    const slot = db.timetable[index];
    db.timetable.splice(index, 1);
    saveDb();

    // Delete from Firebase Firestore
    await deleteDocFromFirestore('timetable', slot.id);

    res.json({ message: 'Timetable slot deleted from Firebase Firestore' });
  } catch (error) {
    console.error('Delete timetable slot error:', error);
    res.status(500).json({ error: 'Failed to delete timetable slot' });
  }
});

module.exports = router;
