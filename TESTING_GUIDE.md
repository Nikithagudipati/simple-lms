# React LMS - Testing Guide

## Servers Status
- ✅ Frontend (React): http://localhost:3000
- ✅ Backend (Express): http://localhost:5000
- ✅ Database: Synced and ready

---

## Testing Checklist

### 1. Login Page
- [ ] Page loads with email and password fields
- [ ] Header is visible at top with LMS branding
- [ ] Can enter email and password
- [ ] Login button is functional
- [ ] Error message displays for invalid credentials
- [ ] Successful login redirects to /catalog

**Test Credentials:**
- Admin: admin@example.com / password
- Instructor: instructor@example.com / password
- Student: student@example.com / password

### 2. Navigation & Header
- [ ] Header shows "Simple LMS" branding
- [ ] Header shows user role badge with username
- [ ] Navigation buttons appear based on user role:
  - [ ] Students see: Courses, Dashboard
  - [ ] Instructors see: Courses, Dashboard, Create
  - [ ] Admins see: Courses, Dashboard, Create
- [ ] Logout button works and returns to login

### 3. Catalog Page (/catalog)
- [ ] Page loads with list of courses
- [ ] Course cards display: title, level, description
- [ ] Search functionality works (search by title/description)
- [ ] Level filter works (beginner/intermediate/advanced)
- [ ] For students: "Enroll" button works and updates enrollment status
- [ ] Clicking course card navigates to /course/:courseId
- [ ] Course enrollment updates the list

### 4. Course Detail Page (/course/:courseId)
- [ ] Page loads course title, description, and level
- [ ] Materials section displays all course materials
- [ ] Quizzes section displays list of quizzes
- [ ] Clicking a quiz shows quiz title and number of questions
- [ ] Click "Take Quiz" opens quiz modal
- [ ] In quiz modal:
  - [ ] All questions display with options
  - [ ] Can select answers for each question
  - [ ] Submit button is functional
  - [ ] After submit: shows score and correct/incorrect answers
  - [ ] Can close modal and go back to course

### 5. Dashboard Page (/dashboard)

#### Student Dashboard:
- [ ] Page loads with statistics cards:
  - [ ] Total Courses Enrolled
  - [ ] Quizzes Taken
  - [ ] Average Score
  - [ ] Courses Completed
- [ ] Chart displays course progress visualization
- [ ] Enrolled courses table shows:
  - [ ] Course name
  - [ ] Progress bar
  - [ ] Quiz count
- [ ] All data loads from backend API

#### Admin Dashboard:
- [ ] Automatically redirects admins to AdminPanel instead
- [ ] Shows statistics: Total Users, Total Courses, Total Enrollments, Total Quizzes
- [ ] Shows user breakdown: Students, Instructors, Admins

### 6. Create Course Page (/create) - Instructor Only
- [ ] Page accessible only to instructors (others redirected to /catalog)
- [ ] Form displays:
  - [ ] Course Title field
  - [ ] Description textarea
  - [ ] Level dropdown (beginner/intermediate/advanced)
- [ ] Form validation works (requires title and description)
- [ ] Create Course button submits form
- [ ] Success message displays after creation
- [ ] New course appears in "Your Courses" section
- [ ] Courses are listed with:
  - [ ] Title and level
  - [ ] Description
  - [ ] Quiz count
  - [ ] Delete button

### 7. Admin Panel (/dashboard for admins)

#### Statistics Tab:
- [ ] Shows 4 stat cards: Total Users, Total Courses, Total Enrollments, Total Quizzes
- [ ] Shows user breakdown: Students, Instructors, Admins counts

#### Users Tab:
- [ ] Displays list of all users in a table
- [ ] Table shows: Email, Full Name, Role, Actions
- [ ] "Add User" button opens form:
  - [ ] Email field
  - [ ] Full Name field
  - [ ] Role dropdown (student/instructor/admin)
  - [ ] Temporary password field
  - [ ] Create User and Cancel buttons
- [ ] New users can be created
- [ ] Reset Password button works (prompts for new password)
- [ ] Delete button removes users (with confirmation)
- [ ] Cannot delete current admin user

#### Courses Tab:
- [ ] Displays all courses in grid format
- [ ] Each course shows:
  - [ ] Course title
  - [ ] Instructor name
  - [ ] Level
  - [ ] Description
  - [ ] Quiz count and student count
  - [ ] Delete Course button
- [ ] Deleting course removes it from database

### 8. Authentication & Security
- [ ] JWT token stored in localStorage after login
- [ ] Token sent with every API request (Authorization header)
- [ ] Expired/invalid tokens redirect to login
- [ ] Protected routes require authentication
- [ ] Role-based access control works:
  - [ ] Instructors can't access admin functions
  - [ ] Students can't access instructor functions
  - [ ] Unauthorized redirects to /catalog

### 9. API Integration
- [ ] All API calls use correct endpoints
- [ ] API responses properly formatted and parsed
- [ ] Error handling displays user-friendly messages
- [ ] Loading states show during API calls
- [ ] Network errors handled gracefully

### 10. UI/UX
- [ ] Styling matches original vanilla JS version
- [ ] Dark theme (#0d0d0e background, #ffd60a yellow accent)
- [ ] Responsive design works on different screen sizes
- [ ] Font Awesome icons load correctly
- [ ] Forms have proper validation and error messages
- [ ] Success/error messages display clearly
- [ ] Buttons have proper hover states
- [ ] Navigation flows logically

---

## Role-Based Testing

### Student User
1. Login as student
2. [ ] See Catalog and Dashboard in nav
3. [ ] Browse courses
4. [ ] Enroll in a course
5. [ ] View enrolled course details
6. [ ] Take a quiz
7. [ ] View dashboard with progress

### Instructor User
1. Login as instructor
2. [ ] See Courses, Dashboard, Create in nav
3. [ ] View catalog
4. [ ] Navigate to Create page
5. [ ] Create a new course
6. [ ] See course in "Your Courses"
7. [ ] Can delete own courses
8. [ ] Dashboard shows stats

### Admin User
1. Login as admin
2. [ ] See Courses, Dashboard, Create in nav
3. [ ] Click Dashboard → goes to AdminPanel
4. [ ] View statistics
5. [ ] Manage users (create, reset password, delete)
6. [ ] Manage courses (view, delete)
7. [ ] View user breakdown

---

## Browser Console Check
After each test section, check browser console (F12) for:
- [ ] No JavaScript errors
- [ ] No network errors (HTTP 200/201 for successful calls)
- [ ] No undefined variable warnings
- [ ] Proper API response logging

---

## Performance Notes
- Frontend loads React app with all components
- Components load on-demand via React Router
- API calls are made only when needed
- Images/assets load properly
- No memory leaks or console warnings

---

## Final Sign-Off
- [ ] All core functionality working
- [ ] UI matches original vanilla JS version
- [ ] No critical errors in console
- [ ] All user roles tested
- [ ] Ready for production deployment

