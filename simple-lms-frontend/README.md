# SimpleLMS - React Frontend

A fully functional Learning Management System (LMS) frontend built with React 19, featuring role-based interfaces, real-time data updates, and comprehensive course management capabilities.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm start

# Build for production
npm run build

# Run tests
npm test
```

**Important**: Ensure the backend server is running on `http://localhost:5000` before starting the frontend.

## 📋 Overview

This React application provides a modern, responsive interface for a complete Learning Management System. The system supports three distinct user roles with tailored interfaces and capabilities:

### User Roles
- **👨‍🎓 Students**: Browse courses, enroll, view materials, take quizzes, track progress
- **👨‍🏫 Instructors**: Create courses, upload materials, design quizzes, monitor students
- **🛡️ Admins**: Manage users, oversee courses, view analytics, impersonate users

## ✨ Key Features

### Student Interface
- **Course Catalog**: Browse and search available courses with filtering
- **Enrollment**: One-click enrollment in courses
- **Material Access**: View PDFs, videos, and text materials in modal viewer
- **Quiz System**: Take quizzes with instant feedback and scoring
- **Dashboard**: Track progress, view scores, see pending quizzes
- **Progress Charts**: Visual representation of time spent and performance
- **Auto-Refresh**: Real-time updates when returning to dashboard

### Instructor Interface
- **Course Creation**: Create courses with rich descriptions and metadata
- **Material Management**: Upload and organize course materials
- **Quiz Builder**: Create multiple-choice quizzes with custom questions
- **Student Monitoring**: View enrolled students and their progress
- **Course Editing**: Update course details and content
- **Analytics**: View course statistics and enrollment data

### Admin Interface
- **User Management**: Create, delete, and manage all user accounts
- **Password Reset**: Reset passwords for any user
- **User Impersonation**: Log in as any user for testing/support
- **Course Oversight**: View, edit, and delete any course
- **System Analytics**: Dashboard with comprehensive statistics
- **Quiz Management**: View and delete quizzes across all courses
- **Enrollment Tracking**: Monitor student enrollments and progress

## 🏗️ Tech Stack

- **Framework**: React 19 with Hooks
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios with JWT interceptors
- **State Management**: React Context API
- **Visualization**: Chart.js with react-chartjs-2
- **Styling**: Pure CSS (responsive, dark theme)
- **Icons**: Font Awesome 6.4.0

## 📁 Project Structure

```
src/
├── components/
│   ├── Header.js              # Navigation header with role-based menu
│   ├── MaterialModal.js       # Material viewer component
│   └── pages/
│       ├── Login.js           # Authentication page
│       ├── Catalog.js         # Course catalog with search
│       ├── CourseDetail.js    # Course view with materials and quizzes
│       ├── Dashboard.js       # Student progress dashboard
│       ├── CreateCourse.js    # Instructor course creation
│       ├── InstructorDashboard.js  # Instructor course management
│       ├── CourseStudents.js  # Student list for instructors
│       └── AdminPanel.js      # Admin management interface
├── context/
│   └── AuthContext.js         # Authentication state management
├── utils/
│   └── api.js                 # Centralized API client with interceptors
├── styles/
│   └── main.css               # Complete application styling
├── App.js                     # Main app with routing
└── index.js                   # React DOM entry point
```

## 🔑 Authentication & Authorization

### JWT Token Management
- Token stored in localStorage
- Automatic inclusion in API requests via Axios interceptors
- Token validation on protected routes
- Automatic logout on token expiration

### Role-Based Access Control
- **Public Routes**: Login page
- **Student Routes**: Dashboard, Catalog, Course Detail
- **Instructor Routes**: Create Course, Instructor Dashboard, Course Students
- **Admin Routes**: Admin Panel with full system access

### Protected Route Implementation
```javascript
// Automatic token injection in API calls
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('lms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 📡 API Integration

All API calls are centralized in `src/utils/api.js`:

### Student APIs
- `apiGetStudentSummary()` - Dashboard data
- `apiGetQuizScoresByCourse()` - Quiz performance
- `apiEnrollCourse(courseId)` - Course enrollment
- `apiSubmitQuiz(quizId, answers)` - Quiz submission
- `apiMarkMaterialAsCompleted(materialId)` - Material tracking

### Instructor APIs
- `apiGetInstructorCourses()` - Instructor's courses
- `apiCreateCourse(courseData)` - Create new course
- `apiUpdateCourse(courseId, data)` - Update course
- `apiCreateQuiz(courseId, quizData)` - Add quiz to course

### Admin APIs
- `apiGetAdminStats()` - System analytics
- `apiGetAllUsers()` - User management
- `apiCreateUser(userData)` - User creation
- `apiDeleteUser(userId)` - User deletion
- `apiImpersonateUser(userId)` - User impersonation
- `apiResetPassword(userId, password)` - Password reset

### Cache Busting
Quiz scores include timestamp parameters to prevent caching:
```javascript
apiClient.get('/student/quiz-scores-by-course', {
  params: { _t: Date.now() }
});
```

## 🎨 Styling & Theme

### Dark Theme Design
- Background: `#0a0a0b` (Dark black)
- Cards: `#18181a` (Slightly lighter)
- Primary Color: `#ffd60a` (Gold/Yellow)
- Text: `#ffffff` (White)
- Muted Text: `#999` (Gray)

### Responsive Design
- Mobile-first approach
- Breakpoints for tablets and desktops
- Flexible grid layouts
- Responsive tables with horizontal scroll

### Component Styles
- Consistent button styling across roles
- Modal overlays for materials and forms
- Loading states and error messages
- Progress bars and charts
- Color-coded quiz scores (green/yellow/red)

## 🔄 State Management

### Context API Usage
```javascript
// AuthContext provides:
- current: Current user object
- token: JWT token
- login(email, password)
- logout()
- saveToken(token)
- saveCurrent(user)
```

### Local State Management
- Component-level useState for UI state
- useEffect for data fetching and side effects
- Automatic data refresh on navigation
- Tab-based data reloading

## 🔔 Real-Time Updates

### Auto-Refresh Mechanisms
1. **Dashboard Data**: Refreshes on location change
2. **Quiz Scores**: Reloads when switching to scores tab
3. **Manual Refresh**: Button to force data reload
4. **Course Detail**: Refreshes after quiz submission

### Data Refresh Strategy
```javascript
// Tab-specific refresh
useEffect(() => {
  if (activeTab === 'scores') {
    reloadQuizScores();
  }
}, [activeTab]);

// Location-based refresh
useEffect(() => {
  loadDashboard();
}, [location]);
```

## 🧩 Component Details

### Header Component
- Dynamic navigation based on user role
- User profile display
- Logout functionality
- Active route highlighting

### Material Modal
- PDF viewer for documents
- Video player support
- Text content display
- Fullscreen overlay with close button

### Dashboard (Student)
- Overview tab with statistics and chart
- Pending quizzes list
- Quiz scores table with color coding
- Auto-refresh on tab switch

### AdminPanel
- Tabbed interface (Stats, Users, Courses)
- User management with role filtering
- Course cards with action buttons
- Modal forms for create/edit operations
- Impersonation functionality

### CourseDetail
- Material list with completion tracking
- Quiz list with attempt status
- Material viewer integration
- Quiz taking interface
- Enrollment button for non-enrolled students

## 🐛 Debugging Features

### Console Logging
- Quiz score reload events
- API response data
- State changes for debugging
- Error messages with stack traces

### Error Handling
- Try-catch blocks on all API calls
- User-friendly error messages
- Graceful degradation on failures
- Network error handling

## 📦 Build & Deployment

### Development Build
```bash
npm start  # Runs on http://localhost:3000
```

### Production Build
```bash
npm run build  # Creates optimized build in /build folder
```

### Environment Variables
Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Deployment Checklist
- [ ] Update API_BASE URL in `api.js`
- [ ] Build production bundle
- [ ] Test all user flows
- [ ] Verify API connectivity
- [ ] Check responsive design
- [ ] Test authentication flow

## 🧪 Testing

### Manual Testing Checklist

**Student Flow:**
1. Login as student
2. Browse catalog
3. Enroll in course
4. View materials
5. Take quiz
6. Check dashboard updates

**Instructor Flow:**
1. Login as instructor
2. Create course
3. Add materials
4. Create quiz
5. View students

**Admin Flow:**
1. Login as admin
2. View analytics
3. Create user
4. Edit course
5. Impersonate user

### Component Testing
```bash
npm test  # Run test suite
```

## 🔧 Troubleshooting

### Common Issues

**White screen on load:**
- Check browser console for errors
- Verify backend is running
- Clear localStorage and retry

**API calls failing:**
- Confirm backend URL in `api.js`
- Check network tab in DevTools
- Verify JWT token is present

**Login not working:**
- Check credentials
- Verify backend authentication endpoint
- Check for CORS issues

**Quiz scores not updating:**
- Click Refresh button
- Switch tabs to trigger reload
- Check browser console logs

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported

## 📚 Additional Resources

- **Backend Documentation**: `../backend/API_REFERENCE.md`
- **Quick Start Guide**: `../QUICKSTART.md`
- **Testing Guide**: `../TESTING_GUIDE.md`
- **Feature Guide**: `../FEATURE_GUIDE.md`

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

### Code Style
- Use functional components with hooks
- Follow React best practices
- Maintain consistent formatting
- Comment complex logic

## 📄 License

MIT License - See LICENSE file for details

---

**React Frontend for SimpleLMS | Built with React 19**
- Token validation on every API request via interceptors
- Automatic redirect to login for unauthorized access

### Course Management
- **Catalog**: Browse all available courses with search and level filtering
- **Enrollment**: Students can enroll in courses
- **Course Details**: View course materials and quizzes
- **Instructor Tools**: Create new courses with title, description, and difficulty level
- **Admin Tools**: View and delete any course from the system

### Quiz System
- Multiple questions per quiz
- Multiple choice answers
- Instant scoring after submission
- View correct/incorrect answers
- Quiz attempt tracking

### Progress Tracking
- Dashboard with enrollment statistics
- Chart visualization of course progress
- Progress bars for each enrolled course
- Quiz performance metrics

### User Management (Admin)
- Create new users with email and role assignment
- Reset user passwords
- Delete user accounts
- View user statistics and breakdown by role

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder with optimizations.

### `npm eject`
Ejects from Create React App (caution: irreversible).

## Testing

See [TESTING_GUIDE.md](../TESTING_GUIDE.md) for comprehensive testing checklist including:
- Login and authentication
- Course catalog and enrollment
- Quiz taking and scoring
- User dashboards
- Admin management panels
- Role-based access control

## Test Credentials

```
Admin:      admin@example.com / password
Instructor: instructor@example.com / password
Student:    student@example.com / password
```

## Development

See [TESTING_GUIDE.md](../TESTING_GUIDE.md) for complete testing procedures and validation checklist.

---

**Status**: ✅ Full React conversion complete with 100% feature parity to original vanilla JS implementation.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
