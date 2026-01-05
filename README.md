# SimpleLMS - Complete Learning Management System

A full-stack Learning Management System (LMS) with role-based access control, course management, quiz functionality, and comprehensive analytics. Built with Node.js/Express backend and React frontend.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL/MariaDB
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   cd simple-lms
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the `backend` directory:
   ```env
   JWT_SECRET=your_secret_key_here
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=lms_db
   PORT=5000
   ```

4. **Setup Frontend**
   ```bash
   cd ../simple-lms-frontend
   npm install
   ```

5. **Start Both Servers**
   
   From the root directory:
   ```bash
   start-servers.bat
   ```
   
   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend
   node server.js

   # Terminal 2 - Frontend
   cd simple-lms-frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 👥 Default Users

### Admin Account
- **Email**: admin@lms.com
- **Password**: Admin123!
- **Capabilities**: Full system access, user management, course oversight

### Instructor Account
- **Email**: instructor@lms.com
- **Password**: Instructor123!
- **Capabilities**: Create courses, manage quizzes, view student progress

### Student Account
- **Email**: student@lms.com
- **Password**: Student123!
- **Capabilities**: Enroll in courses, take quizzes, track progress

## ✨ Features

### For Students
- 📚 Browse and search course catalog
- ✅ Enroll in courses with one click
- 📖 Access course materials (PDF, video, text)
- 📝 Take quizzes with instant grading
- 📊 Track progress and quiz scores
- 🏆 View performance analytics
- ⏱️ Time tracking for course engagement

### For Instructors
- ➕ Create and manage courses
- 📄 Upload course materials
- ❓ Create quizzes with multiple-choice questions
- 👨‍🎓 View enrolled students
- 📈 Monitor student progress
- ✏️ Edit and update course content
- 🗑️ Delete quizzes and materials

### For Admins
- 👥 Complete user management (create, delete, impersonate)
- 📚 Full course oversight
- 🔑 Password reset functionality
- 📊 System-wide analytics
- 👤 User role management
- 🔄 Impersonate any user for testing
- 📈 View enrollment and quiz statistics

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── models/          # Sequelize ORM models
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Quiz.js
│   │   ├── Question.js
│   │   ├── Attempt.js
│   │   ├── Enrollment.js
│   │   ├── CourseMaterial.js
│   │   └── MaterialCompletion.js
│   ├── routes/          # API endpoints
│   │   ├── auth.routes.js
│   │   ├── course.routes.js
│   │   ├── student.routes.js
│   │   ├── instructor.routes.js
│   │   └── admin.routes.js
│   ├── middleware/      # Authentication & authorization
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   ├── config/          # Database configuration
│   │   ├── db.js
│   │   └── syncDb.js
│   └── seeders/         # Sample data
├── uploads/             # Course material uploads
└── server.js           # Entry point
```

### Frontend (React)
```
simple-lms-frontend/
├── src/
│   ├── components/
│   │   ├── Header.js           # Navigation
│   │   ├── MaterialModal.js    # Material viewer
│   │   └── pages/
│   │       ├── Login.js
│   │       ├── Catalog.js
│   │       ├── CourseDetail.js
│   │       ├── Dashboard.js
│   │       ├── CreateCourse.js
│   │       ├── InstructorDashboard.js
│   │       ├── CourseStudents.js
│   │       └── AdminPanel.js
│   ├── context/
│   │   └── AuthContext.js     # Auth state management
│   ├── utils/
│   │   └── api.js             # API client
│   └── styles/
│       └── main.css           # Global styles
└── public/
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL/MariaDB
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Environment**: dotenv

### Frontend
- **Framework**: React 19
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **State Management**: Context API
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Font Awesome 6.4.0
- **Styling**: Pure CSS (Dark Theme)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/instructor/courses` - Create course
- `PUT /api/instructor/courses/:id` - Update course
- `DELETE /api/instructor/courses/:id` - Delete course

### Student
- `GET /api/student/summary` - Student dashboard data
- `POST /api/student/enroll` - Enroll in course
- `POST /api/student/quiz/:quizId/submit` - Submit quiz
- `GET /api/student/quiz-scores-by-course` - Get quiz scores
- `POST /api/student/materials/:id/complete` - Mark material complete

### Instructor
- `GET /api/instructor/courses` - Get instructor courses
- `POST /api/instructor/courses/:id/quizzes` - Create quiz
- `GET /api/instructor/courses/:id/students` - View enrolled students

### Admin
- `GET /api/admin/analytics` - System statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/reset-password` - Reset password
- `POST /api/admin/impersonate/:id` - Impersonate user

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API routes
- Input validation and sanitization
- SQL injection prevention via Sequelize ORM
- XSS protection

## 📊 Database Schema

### Core Models
- **User**: Authentication and profile information
- **Course**: Course details and metadata
- **Enrollment**: Student-course relationship
- **Quiz**: Quiz metadata linked to courses
- **Question**: Quiz questions with answers
- **Attempt**: Quiz attempt records with scores
- **CourseMaterial**: Course content (PDFs, videos, etc.)
- **MaterialCompletion**: Material completion tracking

### Relationships
- User → Enrollments (One-to-Many)
- Course → Enrollments (One-to-Many)
- Course → Quizzes (One-to-Many)
- Quiz → Questions (One-to-Many)
- User → Attempts (One-to-Many)
- Quiz → Attempts (One-to-Many)

## 🧪 Testing

### Quick Test Scenarios

1. **Student Flow**
   - Login as student
   - Browse catalog
   - Enroll in course
   - View materials
   - Take quiz
   - Check dashboard scores

2. **Instructor Flow**
   - Login as instructor
   - Create new course
   - Add materials
   - Create quiz with questions
   - View enrolled students

3. **Admin Flow**
   - Login as admin
   - View system analytics
   - Create new users
   - Manage courses
   - Impersonate users
   - Reset passwords

## 🐛 Troubleshooting

### Backend won't start
- Check if MySQL is running
- Verify `.env` configuration
- Ensure port 5000 is available
- Check database credentials

### Frontend won't connect
- Verify backend is running on port 5000
- Check browser console for errors
- Clear localStorage if auth issues persist
- Ensure CORS is properly configured

### Database errors
- Run database sync: Backend automatically syncs on startup
- Check database permissions
- Verify Sequelize configuration

## 📝 Recent Updates

### Latest Features
- ✅ Admin course editing functionality
- ✅ Quiz score auto-refresh on dashboard
- ✅ Real-time date updates for quiz attempts
- ✅ Course form modal for create/edit
- ✅ Cache busting for quiz scores
- ✅ Improved data refresh mechanisms
- ✅ Enhanced logging for debugging

### Bug Fixes
- Fixed edit button in admin panel
- Fixed quiz scores not updating after retakes
- Fixed date not updating for latest attempts
- Improved dashboard data refresh logic
- Added proper attempt ordering by creation date

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Support

For issues, questions, or contributions, please refer to the documentation files:
- `QUICKSTART.md` - Quick setup guide
- `API_REFERENCE.md` - Complete API documentation
- `TESTING_GUIDE.md` - Testing procedures
- `FEATURE_GUIDE.md` - Detailed feature documentation

## 🎯 Future Enhancements

- [ ] Email notifications
- [ ] Certificate generation
- [ ] Discussion forums
- [ ] Live video streaming
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Payment integration
- [ ] Gamification features

---

**Built with ❤️ using Node.js and React**
