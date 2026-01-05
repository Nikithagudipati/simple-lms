# SimpleLMS - Quick Start Guide

## ⚡ Get Started in 5 Minutes

### Prerequisites
- Node.js v14+ installed
- MySQL/MariaDB running
- npm or yarn

---

## 🚀 Option 1: Quick Start (Recommended)

### 1. Configure Environment
Navigate to backend folder and create `.env` file:
```bash
cd simple-lms/backend
```

Create `.env` with:
```env
JWT_SECRET=super_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
PORT=5000
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../simple-lms-frontend
npm install
```

### 3. Start Both Servers

**Using Batch File (Windows):**
```bash
cd simple-lms
start-servers.bat
```

**Manual Start:**

Terminal 1 (Backend):
```bash
cd simple-lms/backend
node server.js
```
✅ Backend running on `http://localhost:5000`

Terminal 2 (Frontend):
```bash
cd simple-lms/simple-lms-frontend
npm start
```
✅ Frontend running on `http://localhost:3000`

### 4. Login & Explore

Open browser to `http://localhost:3000`

---

## 👥 Default Login Credentials

### Admin Account
- **Email**: admin@lms.com
- **Password**: Admin123!
- **Access**: Full system control

### Instructor Account
- **Email**: instructor@lms.com
- **Password**: Instructor123!
- **Access**: Create/manage courses

### Student Account
- **Email**: student@lms.com
- **Password**: Student123!
- **Access**: Enroll and learn

---

## 📝 What You Can Do

### 👨‍🎓 As a Student
1. **Browse Courses**: View catalog with search and filters
2. **Enroll**: One-click enrollment in courses
3. **View Materials**: Access PDFs, videos, and text content
4. **Take Quizzes**: Complete quizzes with instant grading
5. **Track Progress**: View dashboard with scores and stats
6. **Check Pending Quizzes**: See unattempted quizzes
7. **View Analytics**: Time spent and performance charts

### 👨‍🏫 As an Instructor
1. **Create Courses**: Build courses with descriptions and levels
2. **Upload Materials**: Add PDFs, videos, and text content
3. **Design Quizzes**: Create multiple-choice quizzes
4. **Manage Content**: Edit and update your courses
5. **Monitor Students**: View enrolled students and progress
6. **Track Engagement**: See course statistics

### 🛡️ As an Admin
1. **View Analytics**: System-wide statistics dashboard
2. **Manage Users**: Create, delete, and reset passwords
3. **Oversee Courses**: View, edit, and delete any course
4. **Manage Quizzes**: View and delete quizzes
5. **Impersonate Users**: Login as any user for support
6. **Track Enrollments**: Monitor student progress
7. **Role Management**: Assign user roles

---

## 🎯 Quick Test Flow

### Student Experience (5 minutes)
1. Login as student
2. Go to Catalog → Enroll in a course
3. View Course → Click material to view in modal
4. Take Quiz → See instant results
5. Check Dashboard → View scores and progress
6. Switch to "Pending Quizzes" tab

### Instructor Experience (5 minutes)
1. Login as instructor
2. Click "Create Course" → Fill form
3. Add course materials
4. Create quiz with questions
5. View enrolled students

### Admin Experience (5 minutes)
1. Login as admin
2. View Statistics tab → See system overview
3. Users tab → Create new user
4. Courses tab → Edit/delete courses
5. Try impersonating a student

---

## 🔧 Troubleshooting

### Backend Won't Start
```bash
# Check MySQL is running
# Verify .env credentials
# Ensure port 5000 is free
```

### Frontend Won't Connect
```bash
# Verify backend is running on port 5000
# Check browser console for errors
# Clear localStorage: localStorage.clear()
```

### Database Issues
```bash
# Backend auto-syncs database on startup
# Check database credentials in .env
# Ensure lms_db exists or will be created
```

### Login Issues
```bash
# Verify default users exist (created on first run)
# Check backend console for errors
# Try resetting password as admin
```

---

## 📚 Next Steps

After quick start, explore:
- **README.md** - Complete project documentation
- **TESTING_GUIDE.md** - Detailed testing procedures
- **API_REFERENCE.md** - API endpoint documentation
- **FEATURE_GUIDE.md** - Feature details and usage

---

## 🎉 You're Ready!

The LMS is now running and ready to use. Explore all three roles to see the full functionality!

**Need Help?** Check the main README.md or TESTING_GUIDE.md for more details.

---

**SimpleLMS | Quick Start Complete ✅**

---

## 📂 Project Structure

```
simple-lms/
├── backend/                    # Node.js/Express server
│   ├── server.js              # Start server here
│   ├── src/
│   │   ├── app.js
│   │   ├── models/            # Database models
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth/role middleware
│   │   └── config/            # Database config
│   └── package.json
│
├── simple-lms-frontend/       # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── context/           # Auth context
│   │   ├── utils/             # API client
│   │   ├── styles/            # CSS styling
│   │   ├── App.js            # Main app
│   │   └── index.js          # Entry point
│   ├── public/
│   │   └── index.html        # HTML root
│   ├── package.json
│   └── README.md
│
├── CONVERSION_COMPLETE.md      # Conversion summary
├── TESTING_GUIDE.md            # Testing procedures
└── REACT_MIGRATION_GUIDE.md    # Detailed documentation
```

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password |
| Instructor | instructor@example.com | password |
| Student | student@example.com | password |

---

## 🎯 Key Features

✅ **Student Features**
- Browse courses with search & filter
- Enroll in courses
- Take quizzes with scoring
- View progress dashboard
- Track completed courses

✅ **Instructor Features**
- Create new courses
- Manage course content
- View student enrollments
- Delete courses

✅ **Admin Features**
- System statistics & analytics
- User management (CRUD)
- Course management
- Password reset functionality
- Role assignment

✅ **All Users**
- JWT authentication
- Session persistence
- Responsive design
- Error handling
- Real-time notifications

---

## 🧪 Testing

### Quick Test Flow
1. **Login**: Use test credentials above
2. **Browse**: Go to Courses tab
3. **Enroll**: Click "Enroll" on any course (Student only)
4. **Quiz**: Click course → Take Quiz
5. **Dashboard**: View progress and stats
6. **Admin**: (As admin) Manage users/courses

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete testing checklist.

---

## 🚀 Common Commands

### Frontend
```bash
cd simple-lms-frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Backend
```bash
cd simple-lms/backend

# Start server
node server.js

# Install dependencies
npm install
```

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| [CONVERSION_COMPLETE.md](./CONVERSION_COMPLETE.md) | Summary of React migration |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Comprehensive testing checklist |
| [REACT_MIGRATION_GUIDE.md](./REACT_MIGRATION_GUIDE.md) | Detailed technical documentation |
| [simple-lms-frontend/README.md](./simple-lms-frontend/README.md) | Frontend-specific README |

---

## ⚙️ Troubleshooting

### Backend won't start
```
Error: Port 5000 already in use

Solution: Kill process on port 5000 or use different port
Windows: netstat -ano | findstr :5000
Mac: lsof -i :5000
```

### Frontend shows blank page
```
1. Check console (F12) for errors
2. Verify backend is running on port 5000
3. Check http://localhost:3000 in address bar
4. Hard refresh: Ctrl+Shift+R (Windows)
```

### Login fails
```
1. Check credentials (see table above)
2. Verify backend is running
3. Open DevTools → Network tab
4. Check POST /api/auth/login response
5. Look for error message in browser console
```

### Styles look wrong
```
1. Hard refresh: Ctrl+Shift+R
2. Check Font Awesome CDN loads in DevTools
3. Verify src/styles/main.css is imported
4. Clear browser cache
```

---

## 💡 Tips

- **Hot Reload**: Frontend automatically reloads when you save files
- **Console Errors**: Press F12 to open DevTools and check console
- **API Debugging**: Use Network tab in DevTools to see API calls
- **Token Check**: Open DevTools → Application → localStorage → check `lms_token`

---

## 🔗 URLs

| Service | URL |
|---------|-----|
| React Frontend | http://localhost:3000 |
| API Backend | http://localhost:5000 |
| API Docs | http://localhost:5000/api (if available) |

---

## 📞 Support

If you encounter issues:

1. **Check Console** - F12 → Console tab for errors
2. **Check Network** - F12 → Network tab for API calls
3. **Review Logs** - Check terminal output for backend errors
4. **Read Docs** - See TESTING_GUIDE.md and REACT_MIGRATION_GUIDE.md
5. **Verify Servers** - Make sure both frontend and backend are running

---

## ✅ Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can login with test credentials
- [ ] Can browse courses
- [ ] Can enroll (as student)
- [ ] Can take quiz
- [ ] Can see dashboard
- [ ] Can access admin panel (as admin)
- [ ] No errors in browser console
- [ ] No errors in terminal logs

---

**Status**: ✅ **Ready to Use**

Both servers are configured and ready to run. Start the backend first, then the frontend, and you're good to go!

Questions? See the detailed documentation files above or check the browser console (F12) for specific error messages.
