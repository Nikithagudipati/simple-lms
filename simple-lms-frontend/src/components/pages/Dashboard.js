import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGetStudentSummary, apiGetPendingQuizzesData, apiGetQuizScoresByCourse } from '../../utils/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
  const { current } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [quizScores, setQuizScores] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Load main summary
      const response = await apiGetStudentSummary();
      const data = response.data;
      
      setEnrolledCourses(data.enrolledCourses || []);
      setStats({
        totalEnrolled: data.enrolledCourses?.length || 0,
        totalQuizzesTaken: data.totalAttempts || 0,
        averageScore: Math.round(data.averageScore || 0),
        coursesCompleted: data.completedCourses || 0,
        timeSpent: data.totalTimeSpent || 0, // in minutes
      });

      // Try to load pending quizzes
      try {
        const pendingResponse = await apiGetPendingQuizzesData();
        setPendingQuizzes(pendingResponse.data || []);
      } catch (e) {
        console.error('Could not load pending quizzes:', e);
        setPendingQuizzes([]);
      }

      // Try to load quiz scores by course
      try {
        const scoresResponse = await apiGetQuizScoresByCourse();
        setQuizScores(scoresResponse.data || []);
      } catch (e) {
        console.error('Could not load quiz scores:', e);
        setQuizScores([]);
      }
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeQuiz = (quiz) => {
    if (quiz.courseId) {
      navigate(`/course/${quiz.courseId}`);
    }
  };

  if (loading) return <div className="card"><p>Loading dashboard...</p></div>;

  const chartData = {
    labels: enrolledCourses.map(c => c.title?.substring(0, 10) || 'Course'),
    datasets: [
      {
        label: 'Time Spent (minutes)',
        data: enrolledCourses.map(c => c.timeSpent || 0),
        borderColor: '#ffd60a',
        backgroundColor: 'rgba(255, 214, 10, 0.1)',
        tension: 0.4,
      }
    ]
  };

  return (
    <section className="card">
      <h2><i className="fa-solid fa-gauge"></i> Student Dashboard</h2>
      
      {error && <p className="error-msg">{error}</p>}

      {/* Tab Navigation */}
      <div className="admin-tabs" style={{ marginBottom: '24px', borderBottom: '1px solid #444' }}>
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fa-solid fa-chart-line"></i> Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <i className="fa-solid fa-list-check"></i> Pending Quizzes ({pendingQuizzes.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'scores' ? 'active' : ''}`}
          onClick={() => setActiveTab('scores')}
        >
          <i className="fa-solid fa-trophy"></i> Quiz Scores
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="dashboard-grid">
            <div className="dash-widget">
              <h3>Total Enrolled</h3>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#ffd60a' }}>{stats.totalEnrolled}</p>
            </div>
            <div className="dash-widget">
              <h3>Quizzes Taken</h3>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#ffd60a' }}>{stats.totalQuizzesTaken}</p>
            </div>
            <div className="dash-widget">
              <h3>Average Score</h3>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#ffd60a' }}>{stats.averageScore}%</p>
            </div>
            <div className="dash-widget">
              <h3>Time Spent</h3>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#ffd60a' }}>
                {stats.timeSpent} <span style={{ fontSize: '0.8rem' }}>min</span>
              </p>
            </div>
            <div className="dash-widget">
              <h3>Courses Completed</h3>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#ffd60a' }}>{stats.coursesCompleted}</p>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3>📊 Course Progress</h3>
            {enrolledCourses.length > 0 ? (
              <div style={{ marginTop: '12px', height: '300px' }}>
                <Line data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />
              </div>
            ) : (
              <p className="muted">No enrolled courses yet</p>
            )}
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3>📚 Enrolled Courses</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="marks-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Time Spent (min)</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledCourses.map(course => (
                    <tr key={course.id}>
                      <td>{course.title}</td>
                      <td>{course.instructor || 'N/A'}</td>
                      <td>{course.timeSpent || 0} minutes</td>
                      <td>
                        <div className="progress">
                          <div style={{ width: `${course.progress || 0}%`, height: '100%' }}></div>
                        </div>
                        <span className="small muted">{course.progress || 0}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pending Quizzes Tab */}
      {activeTab === 'pending' && (
        <div>
          <h3>📝 Pending Quizzes</h3>
          {pendingQuizzes.length > 0 ? (
            <div className="grid">
              {pendingQuizzes.map(quiz => (
                <div key={quiz.id} className="course-card">
                  <h4>{quiz.title}</h4>
                  <p className="small muted">{quiz.courseName || quiz.Course?.title || 'Course'}</p>
                  <p className="small">{quiz.totalQuestions ?? quiz.Questions?.length ?? 0} questions</p>
                  <div className="course-actions">
                    <button
                      className="btn small"
                      onClick={() => handleTakeQuiz(quiz)}
                    >
                      <i className="fa-solid fa-arrow-right"></i> Take Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No pending quizzes! You're all caught up. 🎉</p>
          )}
        </div>
      )}

      {/* Quiz Scores Tab */}
      {activeTab === 'scores' && (
        <div>
          <h3>🏆 Quiz Scores by Course</h3>
          {quizScores.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="marks-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quizScores.map((score, idx) => (
                    <tr key={idx}>
                      <td>{score.courseName || 'Course'}</td>
                      <td>{score.quizTitle || score.quizName || 'Quiz'}</td>
                      <td>
                        <span style={{
                          color: (score.percentage ?? score.score) >= 80 ? '#52c41a' : (score.percentage ?? score.score) >= 60 ? '#faad14' : '#ff4d4f',
                          fontWeight: '600'
                        }}>
                          {score.percentage ?? score.score}%
                        </span>
                      </td>
                      <td className="small muted">{score.date ? new Date(score.date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No quiz attempts yet. Take some quizzes to see your scores!</p>
          )}
        </div>
      )}
    </section>
  );
}

export default Dashboard;
