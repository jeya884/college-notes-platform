// MBA College Notes Platform - Client API Client with Firebase & Year/Semester Support
const API_BASE = '/api';

let currentAuthToken = localStorage.getItem('mba_auth_token') || null;
let currentAuthUser = null;

try {
  const savedUser = localStorage.getItem('mba_auth_user');
  if (savedUser) currentAuthUser = JSON.parse(savedUser);
} catch (e) {
  localStorage.removeItem('mba_auth_user');
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Network request failed');
  }

  return data;
}

// Authentication
async function loginAdmin(password) {
  const data = await request('/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
  saveSession(data.token, data.user);
  return data;
}

async function loginStudent(rollNumber, password) {
  const data = await request('/auth/student-login', {
    method: 'POST',
    body: JSON.stringify({ rollNumber, password })
  });
  saveSession(data.token, data.user);
  return data;
}

function saveSession(token, user) {
  currentAuthToken = token;
  currentAuthUser = user;
  localStorage.setItem('mba_auth_token', token);
  localStorage.setItem('mba_auth_user', JSON.stringify(user));
}

function logout() {
  currentAuthToken = null;
  currentAuthUser = null;
  localStorage.removeItem('mba_auth_token');
  localStorage.removeItem('mba_auth_user');
  window.location.href = '/';
}

function getCurrentUser() {
  return currentAuthUser;
}

function isAdmin() {
  return currentAuthUser && currentAuthUser.role === 'admin';
}

function isStudent() {
  return currentAuthUser && currentAuthUser.role === 'student';
}

// Notes (with Year & Semester filters)
async function fetchNotes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.year) params.append('year', filters.year);
  if (filters.semester) params.append('semester', filters.semester);
  if (filters.sort) params.append('sort', filters.sort);
  const q = params.toString() ? `?${params.toString()}` : '';
  return await request(`/notes${q}`);
}

async function getNote(id) {
  return await request(`/notes/${id}`);
}

function downloadNote(id, fileName) {
  const a = document.createElement('a');
  a.href = `/api/notes/${id}/download`;
  a.setAttribute('download', fileName || 'mba_notes.pdf');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function createNote(formData) {
  return await request('/notes', {
    method: 'POST',
    body: formData
  });
}

async function updateNote(id, data) {
  return await request(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function deleteNote(id) {
  return await request(`/notes/${id}`, {
    method: 'DELETE'
  });
}

// Assignments (with Year & Semester filters)
async function fetchAssignments(filters = {}) {
  const params = new URLSearchParams();
  if (filters.year) params.append('year', filters.year);
  if (filters.semester) params.append('semester', filters.semester);
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  const q = params.toString() ? `?${params.toString()}` : '';
  return await request(`/assignments${q}`);
}

async function createAssignment(data) {
  return await request('/assignments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function updateAssignment(id, data) {
  return await request(`/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function deleteAssignment(id) {
  return await request(`/assignments/${id}`, {
    method: 'DELETE'
  });
}

// Timetable (with Day, Year & Semester filters)
async function fetchTimetable(day, year, semester) {
  const params = new URLSearchParams();
  if (day && day !== 'all') params.append('day', day);
  if (year && year !== 'all') params.append('year', year);
  if (semester && semester !== 'all') params.append('semester', semester);
  const q = params.toString() ? `?${params.toString()}` : '';
  return await request(`/timetable${q}`);
}

async function createTimetableSlot(data) {
  return await request('/timetable', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function updateTimetableSlot(id, data) {
  return await request(`/timetable/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function deleteTimetableSlot(id) {
  return await request(`/timetable/${id}`, {
    method: 'DELETE'
  });
}

// Announcements / Communication
async function fetchAnnouncements(year) {
  const params = new URLSearchParams();
  if (year && year !== 'all') params.append('year', year);
  const q = params.toString() ? `?${params.toString()}` : '';
  return await request(`/announcements${q}`);
}

async function createAnnouncement(data) {
  return await request('/announcements', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function updateAnnouncement(id, data) {
  return await request(`/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function deleteAnnouncement(id) {
  return await request('/announcements/${id}', {
    method: 'DELETE'
  });
}

// Admin Management & Statistics
async function fetchAdminStats() {
  return await request('/admin/statistics');
}

async function fetchStudents(search, status, year, semester) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'all') params.append('status', status);
  if (year && year !== 'all') params.append('year', year);
  if (semester && semester !== 'all') params.append('semester', semester);
  const q = params.toString() ? `?${params.toString()}` : '';
  return await request(`/admin/students${q}`);
}

async function extendStudents(endNumber, addCount, year, semester) {
  return await request('/admin/students/extend', {
    method: 'POST',
    body: JSON.stringify({ endNumber, addCount, year, semester })
  });
}

async function addCustomStudent(rollNumber, name, year, semester) {
  return await request('/admin/students/add', {
    method: 'POST',
    body: JSON.stringify({ rollNumber, name, year, semester })
  });
}

async function toggleStudentStatus(roll) {
  return await request(`/admin/students/${encodeURIComponent(roll)}/status`, {
    method: 'PUT'
  });
}

async function deleteStudent(roll) {
  return await request(`/admin/students/${encodeURIComponent(roll)}`, {
    method: 'DELETE'
  });
}

window.API = {
  loginAdmin,
  loginStudent,
  logout,
  getCurrentUser,
  isAdmin,
  isStudent,
  fetchNotes,
  getNote,
  downloadNote,
  createNote,
  updateNote,
  deleteNote,
  fetchAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  fetchTimetable,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  fetchAdminStats,
  fetchStudents,
  extendStudents,
  addCustomStudent,
  toggleStudentStatus,
  deleteStudent
};
