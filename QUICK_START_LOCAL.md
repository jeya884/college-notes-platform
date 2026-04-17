# ⚡ Quick Start Guide - Local MySQL Database

## 🚀 Installation (10 minutes)

### 1️⃣ Install XAMPP
- Download: https://www.apachefriends.org
- Install with MySQL option
- Start Apache & MySQL from XAMPP Control Panel

### 2️⃣ Create Database
1. Open http://localhost/phpmyadmin
2. Copy-paste this SQL:
```sql
CREATE DATABASE college_notes_db CHARACTER SET utf8mb4;
```
3. Click Go

### 3️⃣ Install Node.js Backend

**Windows:**
```bash
cd backend
setup.bat
```

**Linux/Mac:**
```bash
cd backend
bash setup.sh
```

Or manual:
```bash
cd backend
npm install
```

### 4️⃣ Start Backend Server

```bash
cd backend
npm start
```

Should show:
```
Server running on http://localhost:5000
Database initialized successfully!
```

### 5️⃣ Open Frontend

Use any method:
- **VS Code Live Server**: Right-click index.html → Open with Live Server
- **Python**: `python -m http.server 8000`
- **Node**: `npm install -g http-server` then `http-server`

---

## ✅ Test It Works

1. Open http://localhost (or http://localhost:8000)
2. Click Sign Up
3. Create account
4. Browse notes (will be empty initially)
5. Go to Admin Panel
6. Upload a test note

---

## 🛑 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Backend won't start** | Check MySQL is running in XAMPP |
| **Database error** | Verify `backend/.env` has correct credentials |
| **Can't upload files** | Check `backend/uploads` folder exists with write permissions |
| **Port 5000 in use** | Change PORT in `.env` or close other apps |
| **Network error in frontend** | Make sure backend is running on port 5000 |

---

## 📱 Share on Local Network

1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
2. Give classmates: `http://YOUR_IP` (frontend) and `http://YOUR_IP:5000` (backend)

---

## 📊 Check What's Running

- **Frontend**: http://localhost (or http://localhost:8000)
- **Backend API**: http://localhost:5000/api/health
- **Database Manager**: http://localhost/phpmyadmin
- **Uploaded Files**: `backend/uploads/`

---

## 🔄 Restart Guide

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend
# Use Live Server or Python server
```

---

## ✨ All Set!

Your college notes platform is ready to use locally! 🎉
