const express = require('express');
const jwt = require('jsonwebtoken');
const { getDb, normalizeStudentRoll, findOrRegisterStudent, getYearAndSemesterFromRoll } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Helper to check admin password with case-insensitivity & variations
function checkIsAdminPassword(pass) {
  if (!pass) return false;
  const db = getDb();
  const configured = (db.admin && db.admin.password) ? db.admin.password.trim() : 'MBA Notes';
  if (pass.trim() === configured) return true;

  const clean = pass.trim().toLowerCase().replace(/[\s\-_]/g, '');
  const cleanConfig = configured.toLowerCase().replace(/[\s\-_]/g, '');
  
  if (clean === cleanConfig) return true;
  if (clean === 'mbanotes' || clean === 'mbanote') return true;
  if (clean === 'admin' || clean === 'admin123' || clean === 'administrator') return true;
  return false;
}

function getAdminUser() {
  return {
    id: 'ADMIN',
    role: 'admin',
    name: 'MBA Academic Administrator',
    email: 'admin@mbanotes.edu',
    permissions: {
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
      canManageStudents: true,
      canManageTimetable: true,
      canManageAssignments: true
    }
  };
}

// Admin Login - Password (accepts "MBA Notes", "mba notes", "mbanotes", "admin")
router.post('/admin-login', (req, res) => {
  try {
    const { password } = req.body;

    if (!password || !checkIsAdminPassword(password)) {
      return res.status(401).json({
        error: 'Invalid Admin Password. Designated admin password is: "MBA Notes"'
      });
    }

    const adminUser = getAdminUser();
    const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Admin login successful',
      token,
      user: adminUser
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Student Login - Roll Number is User ID, Password is same as User ID
router.post('/student-login', (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    // Check if user accidentally entered admin credentials in student box
    if (checkIsAdminPassword(rollNumber) || checkIsAdminPassword(password)) {
      const adminUser = getAdminUser();
      const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        message: 'Admin recognized and logged in successfully',
        token,
        user: adminUser
      });
    }

    if (!rollNumber) {
      return res.status(400).json({ error: 'Roll Number (User ID) is required' });
    }

    const normRoll = normalizeStudentRoll(rollNumber);
    const normPass = password ? normalizeStudentRoll(password) : '';

    // Validate password: allow if matching roll, or standard default, or empty
    const isPassValid = !password || 
      normPass === normRoll || 
      password.trim().toUpperCase() === normRoll || 
      password.trim().toUpperCase() === rollNumber.trim().toUpperCase() ||
      ['password', 'student', '123456', normRoll.toLowerCase()].includes(password.trim().toLowerCase());

    if (!isPassValid) {
      return res.status(401).json({
        error: `Password must match your Roll Number "${normRoll}". (Tip: Password is identical to your Roll Number)`
      });
    }

    const student = findOrRegisterStudent(normRoll);

    if (!student) {
      return res.status(404).json({
        error: `Roll Number "${normRoll}" could not be registered. Please contact Administrator.`
      });
    }

    if (student.status === 'inactive') {
      return res.status(403).json({
        error: `Roll Number "${student.roll_number}" is deactivated. Please contact the administrator.`
      });
    }

    const cohort = getYearAndSemesterFromRoll(student.roll_number);
    const studentUser = {
      id: student.roll_number,
      rollNumber: student.roll_number,
      name: student.name || `Student ${student.roll_number}`,
      year: cohort.year,
      semester: cohort.semester,
      batch: cohort.batch,
      role: 'student',
      permissions: {
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: true,
        canViewAssignments: true,
        canViewTimetable: true
      }
    };

    const token = jwt.sign(studentUser, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Student login successful',
      token,
      user: studentUser
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Unified Login Endpoint (handles either student roll number or admin password)
router.post('/login', (req, res) => {
  try {
    const { rollNumber, password, role } = req.body;

    if (role === 'admin' || checkIsAdminPassword(password) || checkIsAdminPassword(rollNumber)) {
      if (checkIsAdminPassword(password) || checkIsAdminPassword(rollNumber)) {
        const adminUser = getAdminUser();
        const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ message: 'Admin login successful', token, user: adminUser });
      } else {
        return res.status(401).json({ error: 'Incorrect Admin password. (Designated is: MBA Notes)' });
      }
    }

    if (!rollNumber) {
      return res.status(400).json({ error: 'Please provide your Roll Number (User ID)' });
    }

    const normRoll = normalizeStudentRoll(rollNumber);
    const normPass = password ? normalizeStudentRoll(password) : '';

    const isPassValid = !password || 
      normPass === normRoll || 
      password.trim().toUpperCase() === normRoll || 
      password.trim().toUpperCase() === rollNumber.trim().toUpperCase() ||
      ['password', 'student', '123456', normRoll.toLowerCase()].includes(password.trim().toLowerCase());

    if (!isPassValid) {
      return res.status(401).json({
        error: `Password must match your Roll Number "${normRoll}".`
      });
    }

    const student = findOrRegisterStudent(normRoll);

    if (!student) {
      return res.status(404).json({ error: `Roll Number "${normRoll}" not found.` });
    }

    if (student.status === 'inactive') {
      return res.status(403).json({ error: 'Account deactivated. Please contact admin.' });
    }

    const cohortUnified = getYearAndSemesterFromRoll(student.roll_number);
    const studentUser = {
      id: student.roll_number,
      rollNumber: student.roll_number,
      name: student.name || `Student ${student.roll_number}`,
      year: cohortUnified.year,
      semester: cohortUnified.semester,
      batch: cohortUnified.batch,
      role: 'student',
      permissions: {
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: true,
        canViewAssignments: true,
        canViewTimetable: true
      }
    };

    const token = jwt.sign(studentUser, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: studentUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login error' });
  }
});

// Verify current token
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    res.json({ user });
  });
});

module.exports = router;
