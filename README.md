# 🎓 College Notes Platform

A full-stack web application for college students to upload, share, rate, and download study notes with a **local MySQL database** (no cloud needed).

## 🌟 Features

✅ **User Authentication**
- Student, Teacher, and Admin roles
- Secure login/registration with JWT tokens
- Session management with token expiry

✅ **Notes Management**
- Upload PDF, DOC, DOCX and other study materials
- Search and filter by title, category, or course code
- Sort by rating or downloads
- Download tracking and statistics

✅ **Community Features**
- ⭐ Rate notes 1-5 stars
- ❤️ Save favorite notes
- 📥 Track your downloads
- 👥 View most popular notes

✅ **Admin Dashboard**
- View platform statistics
- Manage users and notes
- Generate reports
- Monitor platform activity

✅ **Responsive Design**
- Works on desktop, tablet, and mobile
- Progressive Web App (PWA) support
- Offline-ready with service workers

---

## 🚀 Quick Start (10 minutes)

### Prerequisites
- **XAMPP** (MySQL) - https://www.apachefriends.org
- **Node.js** (14+) - https://nodejs.org
- A code editor (VS Code recommended)

### Step 1: Start MySQL
- Open XAMPP Control Panel
- Click **Start** next to MySQL

### Step 2: Install Backend
```bash
cd backend
npm install
```

### Step 3: Start Services (3 terminals)

**Terminal 1: Backend Server**
```bash
cd backend
npm start
# Should show: "Server running on http://localhost:5000"
```

**Terminal 2: Frontend**
```bash
# VS Code: Right-click index.html → Open with Live Server
# OR: python -m http.server 8000
```

**Terminal 3: Done!**
Open browser → http://localhost

### Step 4: Sign Up & Test
- Click Sign Up
- Create account with Student role
- Browse and test features!

---

## � Documentation

Choose your learning path:

| Guide | Time | Best For |
|-------|------|----------|
| 📚 [QUICK_START_LOCAL.md](QUICK_START_LOCAL.md) | 5 min | **Just want it working** |
| 📖 [SETUP_GUIDE.md](SETUP_GUIDE.md) | 15 min | **Step-by-step detail** |
| ✅ [FINAL_CHECKLIST.md](FINAL_CHECKLIST.md) | 10 min | **Verify everything works** |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JS | UI & interactions |
| **Backend** | Node.js + Express | API server |
| **Database** | MySQL (XAMPP) | Data storage |
| **Auth** | JWT Tokens | Secure authentication |
| **File Upload** | Multer | Note file storage |
| **Password** | bcryptjs | Secure hashing |

---

## 📁 Project Structure

```
college-notes-platform/
├── 📄 README.md                     # This file
├── 📖 SETUP_GUIDE.md               # Detailed setup
├── 📖 QUICK_START_LOCAL.md         # Quick reference
├── ✅ FINAL_CHECKLIST.md           # Verification
│
├── backend/                         # Node.js server
│   ├── server.js                   # Entry point
│   ├── package.json                # Dependencies
│   ├── .env                        # Configuration
│   ├── config/
│   │   └── database.js             # MySQL setup
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification
│   │   └── upload.js               # File upload
│   ├── routes/
│   │   ├── auth.js                 # Authentication
│   │   ├── notes.js                # Notes CRUD
│   │   └── admin.js                # Admin features
│   └── uploads/                    # Uploaded files
│
├── 📄 index.html                   # Home page
├── 📄 login.html                   # Login page
├── 📄 signup.html                  # Registration page
├── 📄 dashboard.html               # User dashboard
├── 📄 admin-panel.html             # Admin dashboard
│
├── css/
│   ├── style.css                   # Main styles
│   └── responsive.css              # Mobile styles
│
├── js/
│   ├── api.js                      # Backend API client
│   ├── auth.js                     # Auth logic
│   ├── ui.js                       # UI helpers
│   ├── app.js                      # Home page logic
│   ├── admin.js                    # Admin logic
│   └── dashboard.js                # Dashboard logic
│
└── manifest.json                   # PWA configuration
```

---

## 🔐 Authentication & Roles

### User Types
| Role | Capabilities |
|------|-------------|
| **Student** | Download, rate, bookmark notes |
| **Teacher** | Upload, manage own notes, view stats |
| **Admin** | Full control: manage all content, users, view statistics |

### Security Features
- ✅ Passwords hashed with bcryptjs
- ✅ JWT tokens with 24-hour expiry
- ✅ Role-based access control
- ✅ SQL injection prevention (parameterized queries)
- ✅ File upload validation

---

## 💾 Database Schema

### 5 Main Tables

**users** - User accounts
```sql
id, email, password, name, role, created_at
```

**notes** - Uploaded study materials
```sql
id, title, description, category, course_code, 
file_path, uploader_id, download_count, average_rating, created_at
```

**ratings** - Note ratings by users
```sql
id, note_id, user_id, rating (1-5), created_at
```

**downloads** - Download tracking
```sql
id, note_id, user_id, downloaded_at
```

**favorites** - Bookmarked notes
```sql
id, note_id, user_id, added_at
```

---

## 🔌 API Endpoints

### Authentication `/api/auth`
```
POST   /register        - Create new user account
POST   /login           - User login (returns JWT)
GET    /me             - Get current user (protected)
```

### Notes `/api/notes`
```
GET    /                - Browse all notes (filter, search, sort)
POST   /                - Upload new note (protected, multipart)
GET    /:id             - View note details
GET    /:id/download    - Download file & track download
POST   /:id/rate        - Rate note 1-5 (protected)
POST   /:id/favorite    - Add to favorites (protected)
DELETE /:id/favorite    - Remove from favorites (protected)
DELETE /:id             - Delete note (protected)
GET    /user/downloads  - Get user's download history (protected)
GET    /user/favorites  - Get user's bookmarked notes (protected)
GET    /user/uploads    - Get user's uploaded notes (protected)
```

### Admin `/api/admin`
```
GET    /statistics      - Platform statistics (admin only)
GET    /users           - List all users (admin only)
GET    /reports/top-rated      - Top 10 rated notes
GET    /reports/most-downloaded - Top 10 downloaded notes
```

---

## 🖼️ Pages Overview

| Page | Path | Access | Features |
|------|------|--------|----------|
| Home | `index.html` | Public | Browse, search, filter notes |
| Login | `login.html` | Public | User authentication |
| Sign Up | `signup.html` | Public | Create account |
| Dashboard | `dashboard.html` | Logged In | Downloads, uploads, favorites |
| Admin | `admin-panel.html` | Admin Only | Upload, manage, statistics |

---

## 🚀 Running Commands

### Start Everything
```bash
# Terminal 1: Start MySQL in XAMPP Control Panel

# Terminal 2: Start Backend
cd backend
npm start

# Terminal 3: Start Frontend
# Choose one:
# Option A: VS Code Live Server (right-click index.html)
# Option B: python -m http.server 8000
# Option C: http-server
```

### Restart Backend
```bash
cd backend
npm start
```

### View Logs
- Backend: Terminal shows all server logs
- Frontend: Browser DevTools (F12) → Console tab
- Database: phpMyAdmin at http://localhost/phpmyadmin

---

## 📊 Testing

### Create Test Accounts

**Admin Account**
- Email: `admin@college.com`
- Password: `Admin123!`
- Role: Admin

**Teacher Account**
- Email: `teacher@college.com`
- Password: `Teacher123!`
- Role: Teacher

**Student Account**
- Email: `student@college.com`
- Password: `Student123!`
- Role: Student

### Test Workflows
1. Sign up with different roles
2. Upload a test note (as teacher/admin)
3. Download a note (tracks in database)
4. Rate a note (1-5 stars)
5. Add to favorites
6. View admin panel (admin only)
7. Check statistics

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Backend won't start | Check MySQL running in XAMPP |
| Database connection error | Verify credentials in `backend/.env` |
| Port 5000 in use | Kill process or change PORT in `.env` |
| File upload fails | Check `backend/uploads` folder exists |
| Can't login | Check email/password, verify user created |
| 404 on API calls | Ensure backend is running on port 5000 |

**See [SETUP_GUIDE.md](SETUP_GUIDE.md) for more troubleshooting.**

---

## 📱 Access on Local Network

Share with classmates on same WiFi:

1. Find your IP: 
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` (look for inet)

2. Share URLs:
   - Frontend: `http://YOUR_IP`
   - Backend: `http://YOUR_IP:5000`

---

## 🚀 Optional Enhancements

Want to add more features? Try:

- [ ] Email verification for new accounts
- [ ] Password reset functionality
- [ ] Comments & discussions on notes
- [ ] File preview (PDF viewer)
- [ ] User profile pages
- [ ] Notification system
- [ ] Advanced search filters
- [ ] Export notes as PDF
- [ ] Print notes
- [ ] Mobile app (React Native)

---

## 📚 Learning Resources

### Backend
- [Express.js Guide](https://expressjs.com)
- [MySQL Documentation](https://dev.mysql.com/doc)
- [JWT Explained](https://jwt.io)

### Frontend
- [MDN Web Docs](https://developer.mozilla.org)
- [CSS Guide](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [JavaScript Basics](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## 📝 Configuration

Edit `backend/.env` to customize:

```env
# Database Connection
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=college_notes_db
DB_PORT=3306

# Server
PORT=5000

# Security
JWT_SECRET=change_this_to_random_string_in_production

# File Upload
MAX_FILE_SIZE=52428800        # 50MB in bytes
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,xls,xlsx,ppt,pptx,jpg,png

# Frontend
FRONTEND_URL=http://localhost
```

---

## 🔄 Deployment Options

### Option 1: School Network
- Run on school server with static IP
- Access from any school computer

### Option 2: Cloud Server
- Deploy to AWS, DigitalOcean, or Heroku
- Make accessible to all classmates globally

### Option 3: Docker Container
- Package with Docker
- Share container image

---

## ⚖️ License

Created for educational purposes. Free to use and modify.

---

## 🎉 Get Started Now!

👉 **[Quick Start (10 min) →](QUICK_START_LOCAL.md)**

👉 **[Detailed Setup →](SETUP_GUIDE.md)**

👉 **[Verify Setup →](FINAL_CHECKLIST.md)**

---

**Happy note-sharing! 📚✨**
