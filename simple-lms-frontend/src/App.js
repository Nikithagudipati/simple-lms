import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Login from './components/pages/Login';
import Catalog from './components/pages/Catalog';
import CourseDetail from './components/pages/CourseDetail';
import Dashboard from './components/pages/Dashboard';
import CreateCourse from './components/pages/CreateCourse';
import AdminPanel from './components/pages/AdminPanel';
import InstructorDashboard from './components/pages/InstructorDashboard';
import CourseStudents from './components/pages/CourseStudents';
import './styles/main.css';

function AppContent() {
  const { current, token } = useAuth();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Simulate token validation
    setIsValidating(false);
  }, [token]);

  if (isValidating) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;
  }

  return (
    <>
      <Header />
      <main className="container">
        {!current ? (
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/course/:courseId" element={<CourseDetail />} />
            <Route path="/course/:courseId/students" element={
              current.role === 'instructor' || current.role === 'admin' ? <CourseStudents /> : <Navigate to="/catalog" />
            } />
            <Route path="/dashboard" element={
              current.role === 'admin' ? <AdminPanel /> : (current.role === 'instructor' ? <InstructorDashboard /> : <Dashboard />)
            } />
            <Route path="/create" element={current.role === 'instructor' || current.role === 'admin' ? <CreateCourse /> : <Navigate to="/catalog" />} />
            <Route path="/" element={<Navigate to="/catalog" />} />
            <Route path="*" element={<Navigate to="/catalog" />} />
          </Routes>
        )}
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
