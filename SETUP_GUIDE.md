# 🎓 College Notes Platform - Complete Setup Guide

This guide walks you through setting up the college notes platform with a local MySQL database using XAMPP.

---

## 📋 Prerequisites

- **Windows**, **macOS**, or **Linux**
- **XAMPP** with MySQL (free from https://www.apachefriends.org)
- **Node.js 14+** (free from https://nodejs.org)
- A modern web browser (Chrome, Firefox, Safari, Edge)

---

## ✅ Step-by-Step Setup

### Step 1: Install XAMPP

1. **Download XAMPP**: https://www.apachefriends.org/download.html
2. **Run the installer** and choose these components:
   - ✅ Apache
   - ✅ MySQL
   - ✅ PHP (optional)
   - ✅ phpMyAdmin (optional but recommended)
3. **Click Install**
4. **Choose installation location** (default is fine)
5. **Start XAMPP Control Panel** (on Windows, search "XAMPP Control Panel")

### Step 2: Start MySQL

1. Open XAMPP Control Panel
2. Click **Start** next to **MySQL**
3. You should see:
   - ✅ MySQL - Status shows "Running"
   - Port: 3306

**✓ MySQL is now ready!**

### Step 3: Create the Database

**Option A: Using phpMyAdmin (GUI)**
1. Go to http://localhost/phpmyadmin
2. Click **Databases** tab
3. Under "Create database", type: `college_notes_db`
4. Choose Collation: `utf8mb4_unicode_ci`
5. Click **Create**

**Option B: Using MySQL Command (Terminal)**
```sql
CREATE DATABASE college_notes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**✓ Database created!**

### Step 4: Install Node.js

1. Download from https://nodejs.org
2. Choose **LTS (Long Term Support)** version
3. Run the installer and follow prompts
4. **Verify installation** (open terminal/command prompt):
```bash
node --version    # Should show v14.x.x or higher
npm --version     # Should show 6.x.x or higher
```

**✓ Node.js installed!**

### Step 5: Setup Backend

#### Windows:
```bash
cd college-notes-platform\backend
setup.bat
```

#### macOS/Linux:
```bash
cd college-notes-platform/backend
bash setup.sh
```

#### Manual Setup:
```bash
cd college-notes-platform/backend
npm install
```

**✓ Backend dependencies installed!**

### Step 6: Start Backend Server

```bash
cd college-notes-platform/backend
npm start
```

You should see:
```
Server running on http://localhost:5000
Database initialized successfully!
```

**✓ Backend is running!**

---

## 🌐 Step 7: Setup Frontend

### Option A: Using VS Code Live Server (Recommended)
1. Install extension: **Live Server** (search in VS Code extensions)
2. Right-click `index.html`
3. Select **Open with Live Server**
4. Browser opens to `http://localhost:5500` (or similar)

### Option B: Using Python (Built-in on Mac/Linux)
```bash
cd college-notes-platform
python -m http.server 8000
# Open http://localhost:8000
```

### Option C: Using Node http-server
```bash
npm install -g http-server
cd college-notes-platform
http-server
```

**✓ Frontend is running!**

---

## 🧪 Test Everything Works

1. Open http://localhost (or http://localhost:8000)
2. Click **Sign Up**
3. Create an account:
   - Email: `test@college.com`
   - Password: `Test123!`
   - Name: `Test User`
   - Role: `Student`
4. Click **Sign Up**
5. You should see the home page

**✓ Everything works!**

---

## 📁 Project Structure

```
college-notes-platform/
├── backend/              # Node.js/Express server
│   ├── server.js        # Main entry point
│   ├── package.json     # Dependencies
│   ├── .env             # Configuration
│   ├── config/
│   │   └── database.js  # MySQL connection
│   ├── middleware/
│   │   ├── auth.js      # JWT verification
│   │   └── upload.js    # File upload
│   ├── routes/
│   │   ├── auth.js      # Login/Register
│   │   ├── notes.js     # Notes CRUD
│   │   └── admin.js     # Admin functions
│   └── uploads/         # Uploaded files
│
├── index.html           # Home page
├── login.html           # Login page
├── signup.html          # Sign up page
├── dashboard.html       # User dashboard
├── admin-panel.html     # Admin panel
│
├── css/
│   ├── style.css        # Main styles
│   └── responsive.css   # Mobile styles
│
├── js/
│   ├── api.js           # Backend API client
│   ├── auth.js          # Authentication
│   ├── ui.js            # UI helpers
│   ├── app.js           # Home page logic
│   ├── admin.js         # Admin logic
│   └── dashboard.js     # Dashboard logic
│
└── manifest.json        # PWA configuration
```

---

## 🔧 Configuration

Edit `backend/.env` to change settings:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=college_notes_db
DB_PORT=3306

# Server
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# File Upload
MAX_FILE_SIZE=52428800        # 50MB
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,xls,xlsx,ppt,pptx,jpg,png

# Frontend
FRONTEND_URL=http://localhost
```

---

## 🚀 Quick Start Command Reference

**Terminal 1 - Start Backend:**
```bash
cd college-notes-platform/backend
npm start
```

**Terminal 2 - Start Frontend (one of):**

VS Code Live Server:
- Right-click index.html → Open with Live Server

Python:
```bash
cd college-notes-platform
python -m http.server 8000
```

Node http-server:
```bash
cd college-notes-platform
http-server
```

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Backend won't start** | Check MySQL is running. Open XAMPP Control Panel and start MySQL. |
| **"Cannot connect to database"** | Verify DB credentials in `backend/.env`. Default: user=`root`, password=empty. |
| **"Port 5000 already in use"** | Change PORT in `.env` or close other apps using port 5000. |
| **File upload fails** | Ensure `backend/uploads` folder exists and has write permissions. Create it if missing. |
| **Can't see backend API** | Make sure both frontend and backend are running. Check console for network errors. |
| **"Module not found"** | Run `npm install` in the backend folder. |
| **Frontend won't load** | Make sure you're visiting http://localhost, not just file:// |
| **MySQL won't start** | Restart your computer. Check if another MySQL instance is running on port 3306. |

---

## 📱 Access on Local Network

To access the app from other devices on your network:

1. Find your computer IP:
   - **Windows**: Open Command Prompt, type `ipconfig`, look for "IPv4 Address" (e.g., 192.168.x.x)
   - **Mac/Linux**: Open Terminal, type `ifconfig`, look for "inet"

2. Share with classmates:
   - Frontend: `http://YOUR_IP` or `http://YOUR_IP:8000`
   - Backend: Must be running on `http://YOUR_IP:5000`

**Note**: Both devices must be on same WiFi network.

---

## 📊 Database Health Check

**Check if database was created:**
1. Open http://localhost/phpmyadmin
2. Look for `college_notes_db` in left sidebar
3. Tables should exist: `users`, `notes`, `ratings`, `downloads`, `favorites`

**Clear all data (restart fresh):**
```sql
DROP DATABASE college_notes_db;
CREATE DATABASE college_notes_db CHARACTER SET utf8mb4;
```
Then restart backend server.

---

## 💾 Backup Your Data

**Export database:**
```bash
# Linux/Mac
mysqldump -u root college_notes_db > backup.sql

# Windows (from MySQL bin directory)
mysqldump -u root college_notes_db > backup.sql
```

**Restore database:**
```bash
mysql -u root college_notes_db < backup.sql
```

---

## 🎉 You're All Set!

Your college notes platform is now running locally. 

**Key URLs:**
- Frontend: http://localhost or http://localhost:8000
- Backend API: http://localhost:5000/api
- Database Manager: http://localhost/phpmyadmin
- Uploaded files: `backend/uploads/`

**Happy note taking! 📚**

---

## ❓ Need Help?

1. Check the **Troubleshooting** section above
2. Verify all services are running:
   - XAMPP MySQL started
   - Backend `npm start` running
   - Frontend served correctly
3. Check browser console for errors (F12)
4. Check backend terminal for error messages
5. Check `backend/uploads` folder permissions

**All setup issues can be solved by restarting XAMPP and the backend server.**
