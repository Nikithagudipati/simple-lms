import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGetInstructorCourses } from '../../utils/api';

function InstructorDashboard() {
  const { current } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await apiGetInstructorCourses();
      setCourses(response.data || []);
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="card"><p>Loading dashboard...</p></div>;

  return (
    <section className="card">
      <div className="detail-header">
        <div>
          <h1>👨‍🏫 Instructor Dashboard</h1>
          <p className="muted">Welcome back, {current?.name}!</p>
        </div>
        <button className="btn primary" onClick={() => navigate('/create')}>
          <i className="fa-solid fa-plus"></i> Create New Course
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-stats" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <div className="stat-card">
          <h3>{courses.length}</h3>
          <p>Total Courses</p>
        </div>
        <div className="stat-card">
          <h3>{courses.reduce((sum, c) => sum + (c.Quizzes?.length || 0), 0)}</h3>
          <p>Total Quizzes</p>
        </div>
        <div className="stat-card">
          <h3>{courses.reduce((sum, c) => sum + (c.CourseMaterials?.length || 0), 0)}</h3>
          <p>Course Materials</p>
        </div>
      </div>

      <h2>📚 My Courses</h2>
      {courses.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any courses yet.</p>
          <button className="btn primary" onClick={() => navigate('/create')}>
            Create Your First Course
          </button>
        </div>
      ) : (
        <div className="grid" style={{ marginTop: '16px' }}>
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <h4>{course.title}</h4>
              <p>{course.description}</p>
              <div className="course-actions">
                <button
                  className="btn small"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <i className="fa-solid fa-eye"></i> View
                </button>
                <button
                  className="btn small secondary"
                  onClick={() => navigate('/create')}
                >
                  <i className="fa-solid fa-edit"></i> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default InstructorDashboard;
