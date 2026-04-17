// API Configuration - Local Backend
const API_BASE_URL = 'http://localhost:5000/api';

let authToken = localStorage.getItem('token') || null;
let currentUser = null;

// Initialize current user from token
async function checkAuthStatus() {
  const token = localStorage.getItem('token');
  if (token) {
    authToken = token;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        currentUser = data.user;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    }
  }
}

// API Helper Functions
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentication Functions
async function register(email, password, name, role = 'student') {
  try {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role })
    });

    // Save token
    localStorage.setItem('token', data.token);
    authToken = data.token;
    currentUser = data.user;

    return data;
  } catch (error) {
    throw error;
  }
}

async function login(email, password) {
  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    // Save token
    localStorage.setItem('token', data.token);
    authToken = data.token;
    currentUser = data.user;

    return data;
  } catch (error) {
    throw error;
  }
}

function logout() {
  localStorage.removeItem('token');
  authToken = null;
  currentUser = null;
}

// Notes Functions
async function fetchNotes(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.sort) params.append('sort', filters.sort);

    const data = await apiCall(`/notes?${params.toString()}`);
    return data;
  } catch (error) {
    console.error('Fetch notes error:', error);
    return [];
  }
}

async function uploadNote(noteData, file) {
  try {
    const formData = new FormData();
    formData.append('title', noteData.title);
    formData.append('description', noteData.description);
    formData.append('category', noteData.category);
    formData.append('courseCode', noteData.courseCode);
    formData.append('file', file);

    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

async function downloadNote(noteId) {
  try {
    const userId = currentUser ? currentUser.id : null;
    let url = `${API_BASE_URL}/notes/${noteId}/download`;
    if (userId) {
      url += `?userId=${userId}`;
    }

    // Create download link
    const a = document.createElement('a');
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

async function rateNote(noteId, rating) {
  try {
    const data = await apiCall(`/notes/${noteId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating })
    });
    return data;
  } catch (error) {
    console.error('Rate error:', error);
    throw error;
  }
}

async function addToFavorites(noteId) {
  try {
    const data = await apiCall(`/notes/${noteId}/favorite`, {
      method: 'POST'
    });
    return data;
  } catch (error) {
    console.error('Add favorite error:', error);
    throw error;
  }
}

async function removeFromFavorites(noteId) {
  try {
    const data = await apiCall(`/notes/${noteId}/favorite`, {
      method: 'DELETE'
    });
    return data;
  } catch (error) {
    console.error('Remove favorite error:', error);
    throw error;
  }
}

async function deleteNote(noteId) {
  try {
    const data = await apiCall(`/notes/${noteId}`, {
      method: 'DELETE'
    });
    return data;
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

async function getUserDownloads() {
  try {
    if (!currentUser) return [];
    const data = await apiCall('/notes/user/downloads');
    return data;
  } catch (error) {
    console.error('Get downloads error:', error);
    return [];
  }
}

async function getUserFavorites() {
  try {
    if (!currentUser) return [];
    const data = await apiCall('/notes/user/favorites');
    return data;
  } catch (error) {
    console.error('Get favorites error:', error);
    return [];
  }
}

async function getUserUploads() {
  try {
    if (!currentUser) return [];
    const data = await apiCall('/notes/user/uploads');
    return data;
  } catch (error) {
    console.error('Get uploads error:', error);
    return [];
  }
}

// Admin Functions
async function getStatistics() {
  try {
    const data = await apiCall('/admin/statistics');
    return data;
  } catch (error) {
    console.error('Statistics error:', error);
    return { totalNotes: 0, totalUsers: 0, totalDownloads: 0, activeUsers: 0 };
  }
}

async function getAllUsers() {
  try {
    const data = await apiCall('/admin/users');
    return data;
  } catch (error) {
    console.error('Get users error:', error);
    return [];
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', checkAuthStatus);
