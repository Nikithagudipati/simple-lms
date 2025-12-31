import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGetInstructorCourses, apiDeleteCourse, apiDeleteQuiz, apiCreateQuiz } from '../../utils/api';

function InstructorDashboard() {
  const { current } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [selectedCourseForQuiz, setSelectedCourseForQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const response = await apiGetInstructorCourses();
      setCourses(response.data || []);
      console.log('Loaded courses:', response.data);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all quizzes and materials.')) {
      try {
        await apiDeleteCourse(courseId);
        setSuccess('Course deleted successfully!');
        setError('');
        loadCourses();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete course');
        console.error(err);
      }
    }
  };

  const handleDeleteQuiz = async (quizId, courseName) => {
    if (window.confirm(`Are you sure you want to delete this quiz from "${courseName}"?`)) {
      try {
        await apiDeleteQuiz(quizId);
        setSuccess('Quiz deleted successfully!');
        setError('');
        loadCourses();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete quiz');
        console.error(err);
      }
    }
  };

  const handleCreateQuiz = (course) => {
    setSelectedCourseForQuiz(course);
    setShowQuizForm(true);
    setQuizForm({
      title: `${course.title} - Assessment Quiz`,
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    });
  };

  const handleAddQuestion = () => {
    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    });
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = quizForm.questions.filter((_, i) => i !== index);
    setQuizForm({ ...quizForm, questions: newQuestions });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...quizForm.questions];
    newQuestions[index][field] = value;
    setQuizForm({ ...quizForm, questions: newQuestions });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQuestions = [...quizForm.questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuizForm({ ...quizForm, questions: newQuestions });
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!quizForm.title.trim()) {
      setError('Please enter a quiz title');
      return;
    }
    
    for (let i = 0; i < quizForm.questions.length; i++) {
      const q = quizForm.questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1}: Please enter a question`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        setError(`Question ${i + 1}: All options must be filled`);
        return;
      }
    }

    try {
      setError('');
      await apiCreateQuiz(selectedCourseForQuiz.id, quizForm);
      setSuccess('Quiz created successfully!');
      setShowQuizForm(false);
      setSelectedCourseForQuiz(null);
      loadCourses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create quiz');
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
      {success && <div className="success-banner">{success}</div>}

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
        <div className="stat-card">
          <h3>{courses.reduce((sum, c) => sum + (c.attemptCount || 0), 0)}</h3>
          <p>Total Quiz Attempts</p>
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
        <div>
          {courses.map(course => (
            <div key={course.id} className="course-management-card" style={{ marginBottom: '24px' }}>
              <div className="course-card-header">
                <div>
                  <h3>{course.title}</h3>
                  <p className="muted">{course.description}</p>
                  {course.attemptCount > 0 && (
                    <p style={{ color: '#ffd60a', marginTop: '8px', fontSize: '0.9em' }}>
                      📊 {course.attemptCount} student{course.attemptCount !== 1 ? 's have' : ' has'} attempted quiz{course.attemptCount !== 1 ? 'zes' : ''} in this course
                    </p>
                  )}
                </div>
                <div className="course-actions">
                  <button
                    className="btn small"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    <i className="fa-solid fa-eye"></i> View
                  </button>
                  <button
                    className="btn small primary"
                    onClick={() => handleCreateQuiz(course)}
                  >
                    <i className="fa-solid fa-plus"></i> Add Quiz
                  </button>
                  <button
                    className="btn small"
                    style={{ background: '#e74c3c', color: '#fff' }}
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    <i className="fa-solid fa-trash"></i> Delete
                  </button>
                </div>
              </div>
              
              {course.Quizzes && course.Quizzes.length > 0 && (
                <div className="course-quizzes" style={{ marginTop: '16px' }}>
                  <h4 style={{ color: '#ffd60a', marginBottom: '12px' }}>Quizzes:</h4>
                  <div className="quiz-list">
                    {course.Quizzes.map(quiz => (
                      <div key={quiz.id} className="quiz-item">
                        <div className="quiz-info">
                          <span className="quiz-title">{quiz.title}</span>
                          <span className="quiz-meta">{quiz.Questions?.length || 0} questions</span>
                        </div>
                        <button
                          className="btn small"
                          style={{ background: '#e74c3c', color: '#fff' }}
                          onClick={() => handleDeleteQuiz(quiz.id, course.title)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showQuizForm && (
        <div className="modal-overlay" onClick={() => setShowQuizForm(false)}>
          <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Quiz for: {selectedCourseForQuiz?.title}</h2>
              <button className="modal-close" onClick={() => setShowQuizForm(false)}>×</button>
            </div>
            <div className="quiz-content">
              <form onSubmit={handleSubmitQuiz}>
                <div className="create-quiz">
                  <label className="label">Quiz Title</label>
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    placeholder="Enter quiz title"
                  />

                  <h3 style={{ marginTop: '20px', marginBottom: '16px', color: '#ffd60a' }}>Questions</h3>
                  
                  {quizForm.questions.map((question, qIndex) => (
                    <div key={qIndex} className="question-block">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ color: '#ffd60a', margin: 0 }}>Question {qIndex + 1}</h4>
                        {quizForm.questions.length > 1 && (
                          <button
                            type="button"
                            className="btn small danger"
                            onClick={() => handleRemoveQuestion(qIndex)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <label className="label">Question Text</label>
                      <textarea
                        value={question.question}
                        onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                        placeholder="Enter your question"
                        rows="3"
                      />

                      <label className="label" style={{ marginTop: '12px' }}>Options (select the correct answer)</label>
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="option-group">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={question.correctAnswer === optIndex}
                            onChange={() => handleQuestionChange(qIndex, 'correctAnswer', optIndex)}
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            style={{ flex: 1 }}
                          />
                          {question.correctAnswer === optIndex && (
                            <span style={{ color: '#2ecc71', fontSize: '0.85rem', fontWeight: 600 }}>
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={handleAddQuestion}
                    style={{ marginTop: '16px', width: '100%' }}
                  >
                    <i className="fa-solid fa-plus"></i> Add Another Question
                  </button>

                  <div className="quiz-actions" style={{ marginTop: '24px' }}>
                    <button type="submit" className="btn primary submit-btn">
                      <i className="fa-solid fa-check"></i> Create Quiz
                    </button>
                    <button type="button" className="btn secondary cancel-btn" onClick={() => setShowQuizForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default InstructorDashboard;
