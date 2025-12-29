import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  apiGetAdminStats,
  apiGetAllUsers,
  apiGetAllCourses,
  apiDeleteUser,
  apiDeleteCourse,
  apiCreateUser,
  apiResetPassword
} from '../../utils/api';

function AdminPanel() {
  const { current } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    email: '',
    fullName: '',
    role: 'student',
    password: 'TempPassword123!'
  });

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      if (activeTab === 'stats') {
        const response = await apiGetAdminStats();
        const d = response.data || {};
        setStats({
          totalUsers: d.totalUsers || 0,
          totalCourses: d.totalCourses || 0,
          totalEnrollments: d.totalEnrollments || 0,
          totalQuizzes: d.totalQuizzes || d.totalQuizAttempts || 0,
          averageQuizScore: d.averageQuizScore || d.averageScore || 0,
          students: d.students || 0,
          instructors: d.instructors || 0,
          admins: d.admins || 0
        });
      } else if (activeTab === 'users') {
        const response = await apiGetAllUsers();
        setUsers(response.data || []);
      } else if (activeTab === 'courses') {
        const response = await apiGetAllCourses();
        setCourses(response.data || []);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiDeleteUser(userId);
        setSuccess('User deleted successfully!');
        loadAdminData();
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await apiDeleteCourse(courseId);
        setSuccess('Course deleted successfully!');
        loadAdminData();
      } catch (err) {
        setError('Failed to delete course');
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.email || !userForm.fullName) {
      setError('Please fill all fields');
      return;
    }

    try {
      // Backend expects `name` field; map 'fullName' to 'name'
      await apiCreateUser({
        name: userForm.fullName,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role
      });
      setSuccess('User created successfully!');
      setUserForm({ email: '', fullName: '', role: 'student', password: 'TempPassword123!' });
      setShowCreateUserForm(false);
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create user');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password:', 'TempPassword123!');
    if (newPassword) {
      try {
        await apiResetPassword(userId, newPassword);
        setSuccess('Password reset successfully!');
      } catch (err) {
        setError('Failed to reset password');
      }
    }
  };

  return (
    <section className="card">
      <h2><i className="fa-solid fa-shield"></i> Admin Panel</h2>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      {/* Navigation Tabs */}
      <div className="admin-tabs" style={{ marginBottom: '24px', borderBottom: '1px solid #444' }}>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <i className="fa-solid fa-chart-line"></i> Statistics
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <i className="fa-solid fa-users"></i> Users
        </button>
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <i className="fa-solid fa-book"></i> Courses
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Statistics Tab */}
          {activeTab === 'stats' && stats && (
            <div>
              <h3>System Statistics</h3>
              <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="stat-card" style={{ backgroundColor: '#1a1a1b', padding: '16px', borderRadius: '8px' }}>
                  <p className="small muted">Total Users</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd60a' }}>{stats.totalUsers || 0}</p>
                </div>
                <div className="stat-card" style={{ backgroundColor: '#1a1a1b', padding: '16px', borderRadius: '8px' }}>
                  <p className="small muted">Total Courses</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd60a' }}>{stats.totalCourses || 0}</p>
                </div>
                <div className="stat-card" style={{ backgroundColor: '#1a1a1b', padding: '16px', borderRadius: '8px' }}>
                  <p className="small muted">Total Enrollments</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd60a' }}>{stats.totalEnrollments || 0}</p>
                </div>
                <div className="stat-card" style={{ backgroundColor: '#1a1a1b', padding: '16px', borderRadius: '8px' }}>
                  <p className="small muted">Total Quizzes</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd60a' }}>{stats.totalQuizzes || 0}</p>
                </div>
              </div>

              <h3>User Breakdown</h3>
              <div className="admin-breakdown" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#1a1a1b', padding: '16px', borderRadius: '8px' }}>
                  <p className="small muted">Students</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.students || 0}</p>
                </div>
                <div style={{ backgroundColor: '#1a1a1b', padding: '16px', borderRadius: '8px' }}>
                  <p className="small muted">Instructors</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.instructors || 0}</p>
                </div>
                <div style={{ backgroundColor: '#1a1a1b', padding: '16px', borderRadius: '8px' }}>
                  <p className="small muted">Admins</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.admins || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <button className="btn" onClick={() => setShowCreateUserForm(!showCreateUserForm)}>
                  <i className="fa-solid fa-user-plus"></i> Add User
                </button>
              </div>

              {showCreateUserForm && (
                <div className="create-quiz" style={{ marginBottom: '24px' }}>
                  <h3>Create New User</h3>
                  <form onSubmit={handleCreateUser}>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    />
                    <label className="label">Full Name</label>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={userForm.fullName}
                      onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    />
                    <label className="label">Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <label className="label">Temporary Password</label>
                    <input
                      type="text"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    />
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button type="submit" className="btn">Create User</button>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => setShowCreateUserForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <h3>Users List</h3>
              {users.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Full Name</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                          <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>{user.name || user.fullName}</td>
                            <td><span style={{ backgroundColor: '#1a1a1b', padding: '4px 8px', borderRadius: '4px' }}>{user.role}</span></td>
                          <td>
                            <button
                              className="btn small secondary"
                              onClick={() => handleResetPassword(user.id)}
                              style={{ marginRight: '8px' }}
                            >
                              Reset Pass
                            </button>
                            {user.id !== current?.id && (
                              <button
                                className="btn small danger"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">No users found</p>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              <h3>Courses List</h3>
              {courses.length > 0 ? (
                <div className="grid">
                  {courses.map(course => (
                      <div key={course.id} className="course-card">
                      <h4>{course.title}</h4>
                      <p className="small muted">By {course.Instructor?.name || course.User?.name || 'Unknown'}</p>
                      <p className="small muted">{course.level}</p>
                      <p>{course.description}</p>
                      <div style={{ marginTop: 'auto' }}>
                        <p className="small muted">{course.Quizzes?.length || 0} quizzes • {course.Enrollments?.length || 0} students</p>
                        <button
                          className="btn small danger"
                          onClick={() => handleDeleteCourse(course.id)}
                          style={{ marginTop: '8px' }}
                        >
                          Delete Course
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No courses found</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AdminPanel;
