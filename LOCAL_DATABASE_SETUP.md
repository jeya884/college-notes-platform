# College Notes Platform - MySQL/XAMPP Backend Setup

## 🔄 Backend Architecture

Your platform now uses:
- **Frontend**: HTML, CSS, JavaScript (existing)
- **Backend**: Node.js + Express
- **Database**: MySQL (XAMPP)
- **File Storage**: Local filesystem
- **Authentication**: JWT tokens

---

## 🚀 Installation Steps

### Step 1: Install XAMPP

1. Download XAMPP from [apachefriends.org](https://www.apachefriends.org)
2. Install XAMPP
3. Start Apache and MySQL from XAMPP Control Panel
4. Verify MySQL is running on port 3306

### Step 2: Create Database

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Go to **SQL** tab
3. Copy and paste this SQL:

```sql
CREATE DATABASE IF NOT EXISTS college_notes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE college_notes_db;
```

4. Click **Go** to execute

### Step 3: Install Node.js Backend

1. Open command prompt in `backend` folder:
```bash
cd e:\college-notes-platform\backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (already created, but verify):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=college_notes_db
DB_PORT=3306
PORT=5000
JWT_SECRET=your_super_secret_key_change_in_production
```

### Step 4: Start Backend Server

In `backend` folder:
```bash
npm start
```

You should see:
```
Server running on http://localhost:5000
Database initialized successfully!
```

---

## 📁 Backend Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Node dependencies
├── .env                   # Configuration
│
├── config/
│   └── database.js        # MySQL connection & setup
│
├── routes/
│   ├── auth.js           # Login/Register
│   ├── notes.js          # Upload/Download/Rate
│   └── admin.js          # Admin functions
│
├── middleware/
│   ├── auth.js           # JWT authentication
│   └── upload.js         # File upload handling
│
└── uploads/              # Uploaded files stored here
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Notes
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/notes` | Get all notes (with filters) |
| GET | `/api/notes/:id` | Get single note |
| POST | `/api/notes` | Upload note |
| GET | `/api/notes/:id/download` | Download note |
| POST | `/api/notes/:id/rate` | Rate a note |
| POST | `/api/notes/:id/favorite` | Add to favorites |
| DELETE | `/api/notes/:id/favorite` | Remove from favorites |
| DELETE | `/api/notes/:id` | Delete note |

### User
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/notes/user/downloads` | User's downloads |
| GET | `/api/notes/user/favorites` | User's favorites |
| GET | `/api/notes/user/uploads` | User's uploads |

### Admin
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/statistics` | Platform stats |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/reports/top-rated` | Top rated notes |
| GET | `/api/admin/reports/most-downloaded` | Most downloaded |

---

## 🗄️ MySQL Database Schema

The backend automatically creates these tables:

### users
- id (AUTO_INCREMENT)
- email (UNIQUE)
- password (hashed)
- name
- role (student/teacher/admin)
- created_at, updated_at

### notes
- id (AUTO_INCREMENT)
- title
- description
- category
- course_code
- uploader_id (FK to users)
- file_path
- file_size
- file_name
- average_rating
- download_count
- created_at, updated_at

### ratings
- id
- note_id (FK to notes)
- user_id (FK to users)
- rating (1-5)
- created_at

### downloads
- id
- note_id (FK to notes)
- user_id (FK to users)
- created_at

### favorites
- id
- user_id (FK to users)
- note_id (FK to notes)
- created_at

---

## 🔐 Security Features

- **Password Hashing**: Bcrypt (10 rounds)
- **Authentication**: JWT tokens (24h expiry)
- **File Validation**: Type and size checking
- **CORS**: Enabled for frontend communication
- **SQL Injection Protection**: Parameterized queries
- **Role-based Access Control**: Student/Teacher/Admin

---

## 🎯 Quick Test

### Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@college.com",
    "password": "Password123",
    "name": "John Doe",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@college.com",
    "password": "Password123"
  }'
```

### Get All Notes
```bash
curl http://localhost:5000/api/notes
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
1. Check XAMPP MySQL is running
2. Verify credentials in `.env`
3. Ensure database `college_notes_db` exists

### "Port 5000 already in use"
Change PORT in `.env` to another value (5001, 5002, etc.)

### "File upload fails"
1. Check `backend/uploads` folder exists
2. Verify write permissions
3. Check file size < 50MB

### "JWT token invalid"
1. Clear browser localStorage
2. Login again
3. Verify JWT_SECRET in `.env`

---

## 🚀 Production Deployment

### For Local Network
1. Find your machine IP: `ipconfig` (Windows)
2. In frontend, change API_BASE_URL to: `http://YOUR_IP:5000/api`
3. Classmates can access via: `http://YOUR_IP`

### For Internet
1. Use ngrok: `ngrok http 5000`
2. Get public URL and share
3. Update API_BASE_URL in frontend

### For Real Server
1. Install Node.js on server
2. Install MySQL
3. Upload backend folder
4. Run: `npm install && npm start`
5. Use reverse proxy (nginx) for production

---

## 📋 Configuration Reference

### .env File
```
# Database
DB_HOST=localhost          # MySQL host
DB_USER=root               # MySQL user (default root)
DB_PASSWORD=               # MySQL password (empty by default)
DB_DATABASE=college_notes_db
DB_PORT=3306              # MySQL port

# Server
PORT=5000                 # Server port
NODE_ENV=development      # Environment

# Security
JWT_SECRET=your_key       # Change this!

# File Upload
MAX_FILE_SIZE=52428800    # 50MB
UPLOAD_DIR=./uploads      # Where files are stored
ALLOWED_FILE_TYPES=.pdf,.docx,.doc,.png,.jpg,.jpeg
```

---

## 📊 Admin Dashboard

Access admin features with an admin account:

1. Change user role to "admin" in database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@college.com';
```

2. Admin features available:
   - View statistics
   - Manage all users
   - View reports
   - Delete any note

---

## 🔄 Frontend-Backend Integration

The frontend now uses `js/api.js` which:
1. Sends requests to backend API
2. Handles JWT tokens
3. Manages authentication state
4. Uploads files
5. Retrieves data

All frontend pages automatically use the local backend!

---

## 💾 Backup & Restore

### Backup Database
```bash
mysqldump -u root college_notes_db > backup.sql
```

### Restore Database
```bash
mysql -u root college_notes_db < backup.sql
```

---

## 📚 Next Steps

1. ✅ Install XAMPP
2. ✅ Create database
3. ✅ Install Node dependencies
4. ✅ Start backend server
5. ✅ Open frontend in browser
6. ✅ Test registration and upload

---

## 🎉 You're All Set!

Your college notes platform is now running on:
- **Frontend**: http://localhost (any live server)
- **Backend**: http://localhost:5000
- **Database**: MySQL via XAMPP

Everything works locally! 🚀
