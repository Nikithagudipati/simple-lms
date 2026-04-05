import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGetCourseStudents } from '../../utils/api';

function CourseStudents() {
  const { courseId } = useParams();
  const { current } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    loadStudents();
  }, [courseId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiGetCourseStudents(courseId);
      setData(response.data);
    } catch (err) {
      console.error('Error loading students:', err);
      setError(err.response?.data?.msg || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentDetails = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  if (loading) {
    return (
      <section className="card">
        <p>Loading student data...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card">
        <div className="error-banner">{error}</div>
        <button className="btn" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="card">
      <div className="detail-header">
        <div>
          <button 
            className="btn small" 
            onClick={() => navigate('/dashboard')}
            style={{ marginBottom: '12px' }}
          >
            <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
          </button>
          <h1>📊 Student Statistics</h1>
          <h2 style={{ color: '#ffd60a', marginTop: '8px' }}>{data.courseTitle}</h2>
          <p className="muted">Total Students Enrolled: {data.totalStudents}</p>
        </div>
      </div>

      {data.students.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '24px' }}>
          <p>No students enrolled in this course yet.</p>
        </div>
      ) : (
        <div className="students-container" style={{ marginTop: '24px' }}>
          {data.students.map((student) => (
            <div key={student.studentId} className="student-card">
              <div 
                className="student-header"
                onClick={() => toggleStudentDetails(student.studentId)}
                style={{ cursor: 'pointer' }}
              >
                <div className="student-info">
                  <h3>{student.studentName}</h3>
                  <p className="muted">{student.studentEmail}</p>
                  <p style={{ fontSize: '0.85em', color: '#888', marginTop: '4px' }}>
                    Enrolled: {new Date(student.enrolledAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="student-summary">
                  <div className="stat-badge">
                    <span className="stat-value">{student.totalAttempts}</span>
                    <span className="stat-label">Total Attempts</span>
                  </div>
                  <div className="stat-badge">
                    <span className="stat-value">{student.averageScore}%</span>
                    <span className="stat-label">Average Score</span>
                  </div>
                  <i 
                    className={`fa-solid fa-chevron-${expandedStudent === student.studentId ? 'up' : 'down'}`}
                    style={{ color: '#ffd60a', fontSize: '1.2em', marginLeft: '16px' }}
                  ></i>
                </div>
              </div>

              {expandedStudent === student.studentId && (
                <div className="student-details">
                  {student.quizzes.length === 0 ? (
                    <p className="muted" style={{ padding: '16px' }}>
                      No quiz attempts yet
                    </p>
                  ) : (
                    <div className="quiz-attempts-list">
                      <h4 style={{ color: '#ffd60a', marginBottom: '12px' }}>Quiz Attempts:</h4>
                      {student.quizzes.map((quiz) => (
                        <div key={quiz.quizId} className="quiz-attempt-item">
                          <div className="quiz-attempt-header">
                            <span className="quiz-attempt-title">{quiz.quizTitle}</span>
                            <span className="quiz-attempt-count">
                              {quiz.attempts} attempt{quiz.attempts !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="quiz-attempt-stats">
                            <div className="attempt-stat">
                              <span className="attempt-label">Latest Score:</span>
                              <span className="attempt-value">
                                {quiz.latestScore} / {quiz.totalQuestions} ({quiz.percentage}%)
                              </span>
                            </div>
                            <div className="attempt-stat">
                              <span className="attempt-label">Last Attempt:</span>
                              <span className="attempt-value">
                                {new Date(quiz.lastAttemptDate).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar-fill" 
                              style={{ 
                                width: `${quiz.percentage}%`,
                                backgroundColor: quiz.percentage >= 70 ? '#2ecc71' : 
                                                quiz.percentage >= 50 ? '#f39c12' : '#e74c3c'
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CourseStudents;
