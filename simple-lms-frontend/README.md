# Simple LMS - React Frontend

A fully functional Learning Management System (LMS) frontend built with React, featuring student enrollment, course management, quiz functionality, and admin controls.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

**Important**: Ensure the backend server is running on `http://localhost:5000` before starting the frontend.

## Project Overview

This React application was converted from a vanilla JavaScript implementation while maintaining 100% visual and functional parity. The system supports three user roles:
- **Students**: Can browse courses, enroll, take quizzes, and track progress
- **Instructors**: Can create courses, add quizzes, and manage their content
- **Admins**: Can manage users, courses, and view system statistics

## Tech Stack

- **Framework**: React 19 with Hooks
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios with JWT interceptors
- **State Management**: React Context API
- **Visualization**: Chart.js with react-chartjs-2
- **Styling**: Pure CSS (responsive, dark theme)
- **Icons**: Font Awesome 6.4.0

## Project Structure

```
src/
├── components/
│   ├── Header.js              # Navigation header with role-based buttons
│   └── pages/
│       ├── Login.js           # Authentication form
│       ├── Catalog.js         # Course listing and search
│       ├── CourseDetail.js    # Course materials and quizzes
│       ├── Dashboard.js       # Student progress dashboard
│       ├── CreateCourse.js    # Instructor course creation
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

## Features

### Authentication
- Email/password login with JWT token management
- Automatic token persistence in localStorage
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
