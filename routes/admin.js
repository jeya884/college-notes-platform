const express = require('express');
const { getDb, saveDb } = require('../config/database');
const { syncDocToFirestore, deleteDocFromFirestore, firebaseConfig } = require('../config/firebase');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, authorizeRole('admin'));

// Admin Dashboard Overview Statistics
router.get('/statistics', (req, res) => {
  try {
    const db = getDb();
    const totalNotes = db.notes.length;
    const totalDownloads = db.notes.reduce((sum, n) => sum + (n.download_count || 0), 0);
    const totalStudents = db.students.length;
    const activeStudents = db.students.filter(s => s.status !== 'inactive').length;
    const totalAssignments = db.assignments.length;
    const totalTimetableSlots = db.timetable.length;
    const totalAnnouncements = db.announcements.length;

    res.json({
      totalNotes,
      totalDownloads,
      totalStudents,
      activeStudents,
      totalAssignments,
      totalTimetableSlots,
      totalAnnouncements,
      firebaseProject: firebaseConfig?.projectId || 'vast-gravity-mcjpc',
      batchRange: '26MBA01 - 26MBA175 (Year 1) & 25MBA01 - 25MBA175 (Year 2)'
    });
  } catch (error) {
    console.error('Admin statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET Students List (with search, year, semester filter)
router.get('/students', (req, res) => {
  try {
    const db = getDb();
    const { search, status, year, semester } = req.query;

    let students = [...db.students];

    if (year && year !== 'all') {
      students = students.filter(s => s.year && s.year.toLowerCase() === year.toLowerCase());
    }

    if (semester && semester !== 'all') {
      students = students.filter(s => s.semester && s.semester.toLowerCase() === semester.toLowerCase());
    }

    if (search) {
      const q = search.trim().toLowerCase();
      students = students.filter(s =>
        s.roll_number.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'all') {
      students = students.filter(s => s.status === status);
    }

    res.json({
      total: db.students.length,
      filteredCount: students.length,
      students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch student roll numbers' });
  }
});

// EXTEND Roll Numbers Range (Synced to Firebase Firestore)
router.post('/students/extend', async (req, res) => {
  try {
    const db = getDb();
    const { endNumber, addCount, year, semester } = req.body;

    let highestNum = 0;
    for (const s of db.students) {
      const match = s.roll_number.match(/25MBA(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNum) highestNum = num;
      }
    }

    let targetEnd = 0;
    if (endNumber) {
      targetEnd = parseInt(endNumber, 10);
    } else if (addCount) {
      targetEnd = highestNum + parseInt(addCount, 10);
    } else {
      targetEnd = highestNum + 25;
    }

    if (targetEnd <= highestNum) {
      return res.status(400).json({
        error: `Target roll number (${targetEnd}) must be greater than highest existing roll number (${highestNum}).`
      });
    }

    const assignedYear = year || 'Year 1';
    const assignedSem = semester || 'Semester 2';
    const addedStudents = [];

    for (let i = highestNum + 1; i <= targetEnd; i++) {
      const pad = i < 10 ? `0${i}` : `${i}`;
      const roll = `25MBA${pad}`;
      
      if (!db.students.some(s => s.roll_number.toUpperCase() === roll)) {
        const newStudent = {
          roll_number: roll,
          name: `MBA Student ${pad}`,
          year: assignedYear,
          semester: assignedSem,
          batch: '2025-2027',
          status: 'active',
          created_at: new Date().toISOString()
        };
        db.students.push(newStudent);
        addedStudents.push(newStudent);

        // Sync student to Firebase Firestore
        syncDocToFirestore('students', newStudent.roll_number, newStudent);
      }
    }

    saveDb();

    res.status(201).json({
      message: `Successfully extended roll numbers to 25MBA${targetEnd}. Added ${addedStudents.length} new student IDs and synced to Firebase.`,
      addedCount: addedStudents.length,
      totalStudents: db.students.length,
      newHighest: targetEnd
    });
  } catch (error) {
    console.error('Extend students error:', error);
    res.status(500).json({ error: 'Failed to extend student roll numbers' });
  }
});

// ADD Custom Single Roll Number (Synced to Firebase Firestore)
router.post('/students/add', async (req, res) => {
  try {
    const db = getDb();
    const { rollNumber, name, year, semester } = req.body;

    if (!rollNumber) {
      return res.status(400).json({ error: 'Roll Number is required' });
    }

    const cleanRoll = rollNumber.trim().toUpperCase();

    if (db.students.some(s => s.roll_number.toUpperCase() === cleanRoll)) {
      return res.status(409).json({ error: `Roll number ${cleanRoll} already exists!` });
    }

    const newStudent = {
      roll_number: cleanRoll,
      name: (name || `Student ${cleanRoll}`).trim(),
      year: year || 'Year 1',
      semester: semester || 'Semester 2',
      status: 'active',
      created_at: new Date().toISOString()
    };

    db.students.push(newStudent);
    saveDb();

    // Sync to Firebase Firestore
    await syncDocToFirestore('students', newStudent.roll_number, newStudent);

    res.status(201).json({
      message: `Roll number ${cleanRoll} created successfully and saved to Firebase Firestore.`,
      student: newStudent
    });
  } catch (error) {
    console.error('Add custom student error:', error);
    res.status(500).json({ error: 'Failed to add student roll number' });
  }
});

// Toggle student status
router.put('/students/:roll/status', async (req, res) => {
  try {
    const db = getDb();
    const targetRoll = req.params.roll.trim().toUpperCase();
    const student = db.students.find(s => s.roll_number.toUpperCase() === targetRoll);

    if (!student) return res.status(404).json({ error: 'Student roll number not found' });

    student.status = student.status === 'active' ? 'inactive' : 'active';
    saveDb();

    // Sync status update to Firebase Firestore
    await syncDocToFirestore('students', student.roll_number, student);

    res.json({
      message: `Student ${targetRoll} is now ${student.status} (synced to Firebase)`,
      status: student.status
    });
  } catch (error) {
    console.error('Toggle student status error:', error);
    res.status(500).json({ error: 'Failed to update student status' });
  }
});

// DELETE student roll number
router.delete('/students/:roll', async (req, res) => {
  try {
    const db = getDb();
    const targetRoll = req.params.roll.trim().toUpperCase();
    const index = db.students.findIndex(s => s.roll_number.toUpperCase() === targetRoll);

    if (index === -1) return res.status(404).json({ error: 'Student roll number not found' });

    db.students.splice(index, 1);
    saveDb();

    // Delete from Firebase Firestore
    await deleteDocFromFirestore('students', targetRoll);

    res.json({ message: `Roll number ${targetRoll} removed from database and Firebase Firestore` });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student roll number' });
  }
});

module.exports = router;
