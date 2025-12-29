import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCreateCourse, apiGetInstructorCourses, apiCreateQuiz, apiUpdateCourse, apiDeleteCourse, apiDeleteQuiz } from '../../utils/api';

function CreateCourse() {
  const { current } = useAuth();
  const [courses, setCourses] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'intermediate'
  });
  const [quizForm, setQuizForm] = useState({
    courseId: null,
    title: '',
    questions: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

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

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError('Please fill all fields');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const response = await apiCreateCourse(formData);
      setSuccess('Course created successfully!');
      setFormData({ title: '', description: '', level: 'intermediate' });
      setShowCreateForm(false);
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await apiDeleteCourse(courseId);
        setSuccess('Course deleted successfully!');
        loadCourses();
      } catch (err) {
        setError('Failed to delete course');
      }
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await apiDeleteQuiz(quizId);
        setSuccess('Quiz deleted successfully!');
        loadCourses();
      } catch (err) {
        setError('Failed to delete quiz');
      }
    }
  };

  if (loading) return <div className="card"><p>Loading courses...</p></div>;

  return (
    <section className="card">
      <h2><i className="fa-solid fa-plus"></i> Create & Manage</h2>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      {!showCreateForm ? (
        <button className="btn" onClick={() => setShowCreateForm(true)} style={{ marginBottom: '16px' }}>
          <i className="fa-solid fa-plus"></i> New Course
        </button>
      ) : (
        <div className="create-quiz" style={{ marginBottom: '16px' }}>
          <h3>Create New Course</h3>
          <form onSubmit={handleCreateCourse}>
            <label className="label">Course Title</label>
            <input
              type="text"
              placeholder="Enter course title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <label className="label">Description</label>
            <textarea
              placeholder="Enter course description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
            <label className="label">Level</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn">Create Course</button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <h3>Your Courses</h3>
        {courses.length > 0 ? (
          <div className="grid">
            {courses.map(course => (
              <div key={course.id} className="course-card">
                <h4>{course.title}</h4>
                <p className="small muted">{course.level}</p>
                <p>{course.description}</p>
                <div style={{ marginTop: 'auto' }}>
                  <p className="small muted">{course.Quizzes?.length || 0} quizzes</p>
                  <div className="course-actions">
                    <button
                      className="btn small secondary"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No courses created yet</p>
        )}
      </div>
    </section>
  );
}

export default CreateCourse;
