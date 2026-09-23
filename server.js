const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { getDb } = require('./config/database');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const assignmentsRoutes = require('./routes/assignments');
const timetableRoutes = require('./routes/timetable');
const announcementsRoutes = require('./routes/announcements');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static assets
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/admin', adminRoutes);

// Database status & Health check
app.get('/api/health', (req, res) => {
  const db = getDb();
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    stats: {
      notesCount: db.notes.length,
      studentsCount: db.students.length,
      assignmentsCount: db.assignments.length,
      timetableSlots: db.timetable.length,
      rollRange: `${db.students[0]?.roll_number || 'None'} - ${db.students[db.students.length - 1]?.roll_number || 'None'}`
    }
  });
});

// HTML page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel.html'));
});

app.get('/admin-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Fallback for SPA/pages
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`MBA College Notes Platform running on http://${HOST}:${PORT}`);
  const db = getDb();
  console.log(`Database loaded: ${db.notes.length} notes, ${db.students.length} students (Batch ${db.students[0]?.roll_number} to ${db.students[db.students.length - 1]?.roll_number})`);
});
