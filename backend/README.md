# SimpleLMS - Backend API

A robust RESTful API backend for the SimpleLMS Learning Management System, built with Node.js, Express, and Sequelize ORM. Supports role-based authentication, course management, quiz functionality, and comprehensive analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL/MariaDB database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start server
node server.js
```

Server runs on **http://localhost:5000**

## ⚙️ Configuration

Create a `.env` file in the backend root directory:

```env
# JWT Configuration
JWT_SECRET=your_super_secret_key_here

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=lms_db

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token signing | Required |
| `DB_HOST` | MySQL host address | localhost |
| `DB_USER` | Database username | root |
| `DB_PASSWORD` | Database password | Required |
| `DB_NAME` | Database name | lms_db |
| `PORT` | Server port | 5000 |

## 🏗️ Architecture

### Project Structure

```
backend/
├── src/
│   ├── models/              # Sequelize ORM models
│   │   ├── User.js          # User authentication & profiles
│   │   ├── Course.js        # Course information
│   │   ├── Quiz.js          # Quiz metadata
│   │   ├── Question.js      # Quiz questions
│   │   ├── Attempt.js       # Quiz attempt records
│   │   ├── Enrollment.js    # Student-course relationships
│   │   ├── CourseMaterial.js  # Course content
│   │   ├── MaterialCompletion.js  # Material tracking
│   │   └── index.js         # Model associations
│   ├── routes/              # API route handlers
│   │   ├── auth.routes.js   # Authentication endpoints
│   │   ├── course.routes.js # Public course endpoints
│   │   ├── student.routes.js  # Student-specific routes
│   │   ├── instructor.routes.js  # Instructor routes
│   │   └── admin.routes.js  # Admin management routes
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.js  # JWT verification
│   │   └── role.middleware.js  # Role-based access
│   ├── config/              # Configuration files
│   │   ├── db.js            # Database connection
│   │   ├── syncDb.js        # Database sync
│   │   └── testDb.js        # Test connection
│   ├── seeders/             # Database seeders
│   │   ├── seedUsers.js     # Default user accounts
│   │   └── seedCourseMaterials.js  # Sample course data
│   └── app.js               # Express app configuration
├── uploads/                 # File upload directory
├── scripts/                 # Utility scripts
│   └── resetInstructorPassword.js
├── server.js                # Application entry point
├── package.json
└── .env                     # Environment variables
```

## 📊 Database Schema

### Models & Relationships

#### User Model
```javascript
{
  id: INTEGER (Primary Key),
  name: STRING,
  email: STRING (Unique),
  password: STRING (Hashed),
  role: ENUM('student', 'instructor', 'admin'),
  createdAt: DATE,
  updatedAt: DATE
}
```

#### Course Model
```javascript
{
  id: INTEGER (Primary Key),
  title: STRING,
  description: TEXT,
  level: ENUM('Beginner', 'Intermediate', 'Advanced'),
  instructorId: INTEGER (Foreign Key → User),
  createdAt: DATE,
  updatedAt: DATE
}
```

#### Enrollment Model
```javascript
{
  id: INTEGER (Primary Key),
  UserId: INTEGER (Foreign Key → User),
  CourseId: INTEGER (Foreign Key → Course),
  progress: INTEGER (0-100),
  completed: BOOLEAN,
  createdAt: DATE,
  updatedAt: DATE
}
```

#### Quiz Model
```javascript
{
  id: INTEGER (Primary Key),
  title: STRING,
  CourseId: INTEGER (Foreign Key → Course),
  createdAt: DATE,
  updatedAt: DATE
}
```

#### Question Model
```javascript
{
  id: INTEGER (Primary Key),
  QuizId: INTEGER (Foreign Key → Quiz),
  question: TEXT,
  options: JSON (Array of 4 options),
  correctAnswer: INTEGER (0-3),
  createdAt: DATE,
  updatedAt: DATE
}
```

#### Attempt Model
```javascript
{
  id: INTEGER (Primary Key),
  UserId: INTEGER (Foreign Key → User),
  QuizId: INTEGER (Foreign Key → Quiz),
  score: INTEGER,
  createdAt: DATE,
  updatedAt: DATE
}
```

#### CourseMaterial Model
```javascript
{
  id: INTEGER (Primary Key),
  CourseId: INTEGER (Foreign Key → Course),
  title: STRING,
  type: ENUM('pdf', 'video', 'text'),
  content: TEXT,
  filePath: STRING,
  createdAt: DATE,
  updatedAt: DATE
}
```

### Relationships

```
User (1) ----< (Many) Enrollment >---- (Many) Course
User (1) ----< (Many) Attempt >---- (Many) Quiz
Course (1) ----< (Many) Quiz
Course (1) ----< (Many) CourseMaterial
Quiz (1) ----< (Many) Question
User (1) ----< (Many) MaterialCompletion >---- (Many) CourseMaterial
```

## 🔐 Authentication & Authorization

### JWT Authentication

**Token Generation:**
```javascript
const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

**Token Verification Middleware:**
```javascript
// Protects routes requiring authentication
auth(req, res, next)
```

**Role-Based Access Control:**
```javascript
// Restricts access to specific roles
role('admin')(req, res, next)
role('instructor')(req, res, next)
role('student')(req, res, next)
```

### Password Security
- Passwords hashed using bcryptjs (10 salt rounds)
- Never stored in plain text
- Password comparison using bcrypt.compare()

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/login`
Login user and receive JWT token.

**Request:**
```json
{
  "email": "student@lms.com",
  "password": "Student123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "id": 1,
  "name": "Student User",
  "role": "student"
}
```

#### POST `/api/auth/register`
Register new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "student"
}
```

### Course Routes (`/api/courses`)

#### GET `/api/courses`
Get all available courses.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Introduction to JavaScript",
    "description": "Learn JavaScript basics",
    "level": "Beginner",
    "Instructor": {
      "name": "Instructor Name"
    },
    "Enrollments": [...],
    "Quizzes": [...]
  }
]
```

#### GET `/api/courses/:id`
Get detailed course information.

### Student Routes (`/api/student`) - Requires Authentication

#### GET `/api/student/summary`
Get student dashboard data.

**Response:**
```json
{
  "enrolledCourses": [...],
  "totalAttempts": 5,
  "averageScore": 85,
  "completedCourses": 2,
  "totalTimeSpent": 120
}
```

#### POST `/api/student/enroll`
Enroll in a course.

**Request:**
```json
{
  "courseId": 1
}
```

#### GET `/api/student/quiz/:quizId`
Get quiz questions.

**Response:**
```json
{
  "id": 1,
  "title": "JavaScript Quiz",
  "courseId": 1,
  "Questions": [
    {
      "id": 1,
      "question": "What is JavaScript?",
      "options": ["Language", "Framework", "Library", "Tool"]
    }
  ]
}
```

#### POST `/api/student/quiz/:quizId/submit`
Submit quiz answers.

**Request:**
```json
{
  "answers": {
    "1": 0,
    "2": 2,
    "3": 1
  }
}
```

**Response:**
```json
{
  "score": 2,
  "totalQuestions": 3,
  "percentage": 67,
  "passed": true
}
```

#### GET `/api/student/quiz-scores-by-course`
Get all quiz scores for student.

**Response:**
```json
[
  {
    "id": 1,
    "quizTitle": "JavaScript Quiz",
    "courseName": "Intro to JS",
    "score": 4,
    "totalQuestions": 5,
    "percentage": 80,
    "date": "2026-01-05T10:30:00.000Z"
  }
]
```

#### POST `/api/student/materials/:materialId/complete`
Mark material as completed.

#### GET `/api/student/pending-quizzes`
Get list of unattempted quizzes.

### Instructor Routes (`/api/instructor`) - Requires Instructor Role

#### GET `/api/instructor/courses`
Get all courses created by instructor.

#### POST `/api/instructor/courses`
Create new course.

**Request:**
```json
{
  "title": "Advanced React",
  "description": "Master React concepts",
  "level": "Advanced"
}
```

#### PUT `/api/instructor/courses/:id`
Update course details.

#### DELETE `/api/instructor/courses/:id`
Delete course.

#### POST `/api/instructor/courses/:courseId/quizzes`
Create quiz for course.

**Request:**
```json
{
  "title": "React Quiz",
  "questions": [
    {
      "question": "What is JSX?",
      "options": ["Syntax", "Language", "Tool", "Library"],
      "correctAnswer": 0
    }
  ]
}
```

#### GET `/api/instructor/courses/:courseId/students`
Get list of enrolled students.

#### DELETE `/api/instructor/quizzes/:quizId`
Delete quiz.

### Admin Routes (`/api/admin`) - Requires Admin Role

#### GET `/api/admin/analytics`
Get system-wide statistics.

**Response:**
```json
{
  "totalUsers": 50,
  "totalCourses": 15,
  "totalEnrollments": 200,
  "totalQuizzes": 45,
  "totalQuizAttempts": 350,
  "averageQuizScore": 78,
  "students": 40,
  "instructors": 8,
  "admins": 2
}
```

#### GET `/api/admin/users`
Get all users.

#### POST `/api/admin/users`
Create new user.

**Request:**
```json
{
  "name": "New User",
  "email": "newuser@lms.com",
  "password": "TempPassword123!",
  "role": "student"
}
```

#### DELETE `/api/admin/users/:userId`
Delete user account.

#### POST `/api/admin/users/:userId/reset-password`
Reset user password.

**Request:**
```json
{
  "newPassword": "NewSecurePass123!"
}
```

#### POST `/api/admin/impersonate/:userId`
Impersonate user (generate token for user).

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "id": 5,
  "name": "Target User",
  "role": "student"
}
```

#### GET `/api/admin/courses`
Get all courses (with full details).

#### DELETE `/api/admin/courses/:courseId`
Delete any course.

#### POST `/api/admin/courses`
Create course as admin.

#### PUT `/api/admin/courses/:courseId`
Update any course.

## 🔍 Advanced Features

### Progress Tracking

Courses track student progress based on:
- Material completion (50% weight)
- Quiz completion (50% weight)

```javascript
const progress = (completedMaterials / totalMaterials) * 50 +
                 (completedQuizzes / totalQuizzes) * 50;
```

### Quiz Retakes

Students can retake quizzes:
- Latest attempt score is displayed
- All attempts are stored
- Progress updates based on quiz completion

### Material Completion

Students can mark materials as completed:
- Tracks which materials have been viewed
- Updates course progress automatically
- Persists across sessions

### Time Tracking

System tracks time spent on courses:
```javascript
POST /api/student/track-time
{
  "courseId": 1,
  "minutes": 30
}
```

### Search & Filtering

Courses can be filtered:
- By instructor
- By level (Beginner/Intermediate/Advanced)
- By enrollment status

## 🛠️ Middleware

### Authentication Middleware (`auth.js`)
```javascript
// Verifies JWT token
// Adds user info to req.user
// Returns 401 if invalid
```

### Role Middleware (`role.js`)
```javascript
// Checks user role
// Returns 403 if unauthorized
// Supports: 'student', 'instructor', 'admin'
```

## 🗄️ Database Operations

### Automatic Sync
Database syncs automatically on server start:
```javascript
sequelize.sync({ alter: true })
```

### Seeders
Default data can be seeded:
```bash
node src/seeders/seedUsers.js
node src/seeders/seedCourseMaterials.js
```

### Default Accounts Created
- Admin: admin@lms.com / Admin123!
- Instructor: instructor@lms.com / Instructor123!
- Student: student@lms.com / Student123!

## 📝 Logging

Console logging for debugging:
- Quiz grading details
- Quiz score retrieval
- User authentication
- Database operations
- API requests

## 🔧 Error Handling

### Standard Error Responses
```json
{
  "msg": "Error message here"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## 🧪 Testing

### Manual Testing

**Test Authentication:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@lms.com","password":"Student123!"}'
```

**Test Protected Route:**
```bash
curl http://localhost:5000/api/student/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Database Testing
```bash
node src/config/testDb.js
```

## 🚀 Deployment

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Configure production database
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Set up proper CORS
- [ ] Configure file upload limits
- [ ] Set up database backups
- [ ] Enable request rate limiting
- [ ] Set up logging service
- [ ] Configure error monitoring

### Environment Setup
```bash
# Production environment
NODE_ENV=production
JWT_SECRET=very_secure_random_string
DB_HOST=production-db-host
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists
- Check user permissions

### JWT Errors
- Verify JWT_SECRET is set
- Check token expiration
- Ensure proper token format

### CORS Issues
- Configure CORS in app.js
- Check allowed origins
- Verify headers

## 📚 Dependencies

### Core Dependencies
- **express**: Web framework
- **sequelize**: ORM for MySQL
- **mysql2**: MySQL driver
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **dotenv**: Environment variables
- **multer**: File uploads
- **cors**: Cross-origin requests

## 🤝 Contributing

### Code Standards
- Use async/await for database operations
- Include error handling in all routes
- Add comments for complex logic
- Follow RESTful API conventions

### Adding New Routes
1. Create route file in `src/routes/`
2. Add middleware (auth, role)
3. Implement handlers
4. Add to app.js
5. Update API documentation

## 📄 License

MIT License

---

**Backend API for SimpleLMS | Built with Node.js & Express**
