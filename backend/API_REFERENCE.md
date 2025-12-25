# LMS Backend API Reference

## Auth
POST /api/auth/login
Body:
{
  "email": "",
  "password": ""
}

Response:
{
  "token": "",
  "role": ""
}

---

## Admin
GET /api/admin/courses
POST /api/admin/courses
PUT /api/admin/courses/:id
DELETE /api/admin/courses/:id

---

## Instructor
POST /api/instructor/courses
POST /api/instructor/materials
POST /api/instructor/quizzes

---

## Student
POST /api/student/enroll
GET /api/student/quizzes/:courseId
POST /api/student/attempt-quiz
GET /api/student/dashboard-summary
