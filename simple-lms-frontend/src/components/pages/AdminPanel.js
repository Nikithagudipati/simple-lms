import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  apiGetAdminStats,
  apiGetAllUsers,
  apiGetAllCourses,
  apiDeleteUser,
  apiDeleteCourse,
  apiCreateUser,
  apiResetPassword,
  apiImpersonateUser,
  apiAdminCreateCourse,
  apiAdminUpdateCourse,
  apiAdminCreateQuiz,
  apiAdminUpdateQuiz,
  apiAdminDeleteQuiz
} from '../../utils/api';
import MaterialModal from '../MaterialModal';

function AdminPanel() {
  const { current, saveToken, saveCurrent } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [showCreateCourseForm, setShowCreateCourseForm] = useState(false);
  const [showCreateQuizForm, setShowCreateQuizForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourseMaterials, setSelectedCourseMaterials] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [quizFormData, setQuizFormData] = useState({ title: '', questions: [] });
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    instructorId: '',
    level: 'Beginner'
  });
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

  const handleImpersonate = async (userId) => {
    try {
      const resp = await apiImpersonateUser(userId);
      const { token, id, role, name } = resp.data;
      // Save impersonation token and user info
      saveToken(token);
      saveCurrent({ id, name, role });
      // Redirect depending on role
      if (role === 'instructor') {
        window.location.href = '/create';
      } else if (role === 'student') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/admin';
      }
    } catch (err) {
      setError('Failed to impersonate user');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseFormData.title || !courseFormData.description) {
      setError('Please fill in title and description');
      return;
    }

    try {
      await apiAdminCreateCourse(courseFormData);
      setSuccess('Course created successfully!');
      setCourseFormData({ title: '', description: '', instructorId: '', level: 'Beginner' });
      setShowCreateCourseForm(false);
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create course');
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse || !courseFormData.title) {
      setError('Please fill in title');
      return;
    }

    try {
      await apiAdminUpdateCourse(editingCourse.id, courseFormData);
      setSuccess('Course updated successfully!');
      setEditingCourse(null);
      setCourseFormData({ title: '', description: '', instructorId: '', level: 'Beginner' });
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update course');
    }
  };

  const startEditCourse = (course) => {
    setEditingCourse(course);
    setCourseFormData({
      title: course.title,
      description: course.description,
      instructorId: course.instructorId || '',
      level: course.level || 'Beginner'
    });
    setShowCreateCourseForm(true);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!selectedCourseMaterials || !quizFormData.title) {
      setError('Enter quiz title');
      return;
    }

    if (quizFormData.questions.length === 0) {
      setError('Add at least one question');
      return;
    }

    try {
      const quizData = {
        courseId: selectedCourseMaterials.id,
        title: quizFormData.title,
        questions: quizFormData.questions
      };
      await apiAdminCreateQuiz(quizData);
      setSuccess('Quiz created successfully!');
      setQuizFormData({ title: '', questions: [] });
      setShowCreateQuizForm(false);
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create quiz');
    }
  };

  const addQuestion = () => {
    setQuizFormData({
      ...quizFormData,
      questions: [
        ...quizFormData.questions,
        { question: '', options: ['', '', '', ''], correctAnswer: 0 }
      ]
    });
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...quizFormData.questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuizFormData({ ...quizFormData, questions: updated });
  };

  const updateQuestionOption = (qIdx, optIdx, value) => {
    const updated = [...quizFormData.questions];
    updated[qIdx].options[optIdx] = value;
    setQuizFormData({ ...quizFormData, questions: updated });
  };

  const removeQuestion = (idx) => {
    setQuizFormData({
      ...quizFormData,
      questions: quizFormData.questions.filter((_, i) => i !== idx)
    });
  };

  const viewCourseMaterials = (course) => {
    setSelectedCourseMaterials(course);
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
                              <>
                                <button
                                  className="btn small"
                                  onClick={() => handleImpersonate(user.id)}
                                  style={{ marginRight: '8px' }}
                                >
                                  Impersonate
                                </button>
                                <button
                                  className="btn small danger"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  Delete
                                </button>
                              </>
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
              <div style={{ marginBottom: '16px' }}>
                <button className="btn" onClick={() => { setShowCreateCourseForm(!showCreateCourseForm); setEditingCourse(null); setCourseFormData({ title: '', description: '', instructorId: '', level: 'Beginner' }); }}>
                  <i className="fa-solid fa-plus"></i> Create Course
                </button>
              </div>

              {showCreateCourseForm && (
                <div className="create-quiz" style={{ marginBottom: '24px' }}>
                  <h3>{editingCourse ? 'Edit Course' : 'Create New Course'}</h3>
                  <form onSubmit={editingCourse ? handleEditCourse : handleCreateCourse}>
                    <label className="label">Course Title</label>
                    <input
                      type="text"
                      placeholder="Enter course title"
                      value={courseFormData.title}
                      onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                    />
                    <label className="label">Description</label>
                    <textarea
                      placeholder="Enter course description"
                      value={courseFormData.description}
                      onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                    ></textarea>
                    <label className="label">Level</label>
                    <select
                      value={courseFormData.level}
                      onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button type="submit" className="btn">{editingCourse ? 'Update Course' : 'Create Course'}</button>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => { setShowCreateCourseForm(false); setEditingCourse(null); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <h3>Courses List</h3>
              {courses.length > 0 ? (
                <div className="grid">
                  {courses.map(course => (
                    <div key={course.id} className="course-card" style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4>{course.title}</h4>
                      <p className="small muted">By {course.Instructor?.name || 'Unknown'}</p>
                      <p className="small muted">{course.level || 'N/A'}</p>
                      <p>{course.description}</p>
                      <div style={{ marginTop: 'auto' }}>
                        <p className="small muted">{course.Quizzes?.length || 0} quizzes • {course.Enrollments?.length || 0} students</p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="btn small"
                            onClick={() => viewCourseMaterials(course)}
                            title="View materials and create quizzes"
                          >
                            <i className="fa-solid fa-eye"></i> View
                          </button>
                          <button
                            className="btn small secondary"
                            onClick={() => startEditCourse(course)}
                          >
                            <i className="fa-solid fa-edit"></i> Edit
                          </button>
                          <button
                            className="btn small danger"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <i className="fa-solid fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No courses found</p>
              )}
            </div>
          )}

          {/* Course Materials Modal */}
          {selectedCourseMaterials && (
            <div className="modal-overlay" onClick={() => setSelectedCourseMaterials(null)}>
              <div className="material-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                  <h2>{selectedCourseMaterials.title}</h2>
                  <button className="modal-close" onClick={() => setSelectedCourseMaterials(null)}>×</button>
                </div>

                <div className="material-content" style={{ padding: '24px' }}>
                  {/* Materials Section */}
                  <h3 style={{ marginBottom: '16px' }}>📚 Course Materials ({selectedCourseMaterials.CourseMaterials?.length || 0})</h3>
                  {selectedCourseMaterials.CourseMaterials && selectedCourseMaterials.CourseMaterials.length > 0 ? (
                    <div style={{ marginBottom: '32px' }}>
                      {selectedCourseMaterials.CourseMaterials.map(material => (
                        <div key={material.id} className="material-card" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1b', padding: '12px', borderRadius: '4px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0' }}>{material.title}</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>{material.type || 'Material'}</p>
                          </div>
                          <button className="btn small" onClick={() => setSelectedMaterial(material)}>
                            <i className="fa-solid fa-eye"></i> View
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#999', marginBottom: '32px' }}>No materials yet</p>
                  )}

                  {/* Quizzes Section */}
                  <h3 style={{ marginBottom: '16px' }}>📝 Quizzes ({selectedCourseMaterials.Quizzes?.length || 0})</h3>
                  {selectedCourseMaterials.Quizzes && selectedCourseMaterials.Quizzes.length > 0 ? (
                    <div style={{ marginBottom: '32px' }}>
                      {selectedCourseMaterials.Quizzes.map(quiz => (
                        <div key={quiz.id} style={{ backgroundColor: '#1a1a1b', padding: '12px', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0' }}>{quiz.title}</h4>
                          </div>
                          <button className="btn small danger" onClick={() => { if(window.confirm('Delete quiz?')) { apiAdminDeleteQuiz(quiz.id).then(() => { setSuccess('Quiz deleted'); loadAdminData(); setSelectedCourseMaterials(null); }).catch(() => setError('Failed to delete quiz')); } }}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#999', marginBottom: '32px' }}>No quizzes yet</p>
                  )}

                  {/* Create Quiz Button */}
                  <button 
                    className="btn" 
                    onClick={() => setShowCreateQuizForm(!showCreateQuizForm)}
                    style={{ marginBottom: '16px' }}
                  >
                    <i className="fa-solid fa-plus"></i> Create New Quiz
                  </button>

                  {showCreateQuizForm && (
                    <div style={{ backgroundColor: '#0f0f10', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                      <h4>Create Quiz for {selectedCourseMaterials.title}</h4>
                      <form onSubmit={handleCreateQuiz}>
                        <label className="label">Quiz Title</label>
                        <input
                          type="text"
                          placeholder="Enter quiz title"
                          value={quizFormData.title}
                          onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                        />

                        <h4 style={{ marginTop: '16px' }}>Questions</h4>
                        {quizFormData.questions.map((q, qIdx) => (
                          <div key={qIdx} style={{ backgroundColor: '#1a1a1b', padding: '12px', borderRadius: '4px', marginBottom: '12px' }}>
                            <label className="label">Question {qIdx + 1}</label>
                            <input
                              type="text"
                              placeholder="Enter question"
                              value={q.question}
                              onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                            />
                            
                            <label className="label" style={{ marginTop: '8px' }}>Options</label>
                            {q.options.map((opt, optIdx) => (
                              <input
                                key={optIdx}
                                type="text"
                                placeholder={`Option ${optIdx + 1}`}
                                value={opt}
                                onChange={(e) => updateQuestionOption(qIdx, optIdx, e.target.value)}
                                style={{ marginBottom: '4px' }}
                              />
                            ))}

                            <label className="label" style={{ marginTop: '8px' }}>Correct Answer (0-3)</label>
                            <input
                              type="number"
                              min="0"
                              max="3"
                              value={q.correctAnswer}
                              onChange={(e) => updateQuestion(qIdx, 'correctAnswer', parseInt(e.target.value))}
                            />

                            <button
                              type="button"
                              className="btn small danger"
                              onClick={() => removeQuestion(qIdx)}
                              style={{ marginTop: '8px' }}
                            >
                              Remove Question
                            </button>
                          </div>
                        ))}

                        <button type="button" className="btn small secondary" onClick={addQuestion} style={{ marginBottom: '16px' }}>
                          <i className="fa-solid fa-plus"></i> Add Question
                        </button>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="btn">Create Quiz</button>
                          <button type="button" className="btn secondary" onClick={() => { setShowCreateQuizForm(false); setQuizFormData({ title: '', questions: [] }); }}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Material Viewer Modal */}
          {selectedMaterial && <MaterialModal material={selectedMaterial} onClose={() => setSelectedMaterial(null)} />}
        </>
      )}
    </section>
  );
}

export default AdminPanel;
