# Quick Start - Simple LMS

## ⚡ Get Started in 5 Minutes

### Prerequisites
- Node.js v16+ and npm installed
- Git (optional)

### 1. Start Backend Server
```bash
cd simple-lms/backend
node server.js
```
✅ Backend running on `http://localhost:5000`

### 2. Start React Frontend
Open **new terminal** and run:
```bash
cd simple-lms-frontend
npm start
```
✅ Frontend running on `http://localhost:3000`

### 3. Login & Test
Open browser to `http://localhost:3000` and login with:
- **Email**: admin@example.com
- **Password**: password

---

## 📝 What You Can Do

### As a Student
1. Browse courses in the catalog
2. Enroll in courses
3. Take quizzes and see scores
4. View progress on dashboard

### As an Instructor
1. Create new courses
2. Manage your courses
3. View student enrollments
4. (Admin panel access for special functions)

### As an Admin
1. View system statistics
2. Manage all users (create, reset password, delete)
3. Manage all courses (view, delete)
4. See user breakdown by role

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
