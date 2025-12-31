import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGetCourseDetail, apiTrackCourseTime, apiGetQuiz, apiSubmitQuiz, apiMarkMaterialAsCompleted, apiEnrollCourse, apiGetStudentSummary, apiGetCompletedMaterials } from '../../utils/api';
import MaterialModal from '../MaterialModal';

function CourseDetail() {
  const { courseId } = useParams();
  const { current } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseTimeStart, setCourseTimeStart] = useState(Date.now());
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [completedMaterials, setCompletedMaterials] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadCourseDetail();
    return () => {
      // Track time spent
      if (current?.role === 'student' && courseId) {
        const timeSpent = Math.floor((Date.now() - courseTimeStart) / 60000);
        if (timeSpent > 0) {
          apiTrackCourseTime(courseId, timeSpent).catch(e => console.error('Error tracking time:', e));
        }
      }
    };
  }, [courseId, current]);

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      const response = await apiGetCourseDetail(courseId);
      const courseData = response.data;
      // Normalize instructor field and URL fields for materials
      const normalized = {
        ...courseData,
        instructor: courseData.Instructor?.name || courseData.instructor || courseData.User?.name || null,
        level: courseData.level || 'intermediate',
        // Normalize material URLs
        CourseMaterials: (courseData.CourseMaterials || []).map(m => ({
          ...m,
          content: m.content || m.url  // Fallback to url if content is not set
        }))
      };
      setCourse(normalized);
      setQuizzes((courseData.Quizzes || []));
      setMaterials(normalized.CourseMaterials || []);
      
      // Check if instructor owns this course
      if (current?.role === 'instructor') {
        const instructorId = courseData.Instructor?.id || courseData.instructorId || courseData.userId;
        setIsOwner(instructorId === current.id);
      }
      
      // Check if student is enrolled by checking student summary
      if (current?.role === 'student') {
        try {
          const summaryResponse = await apiGetStudentSummary();
          const enrolledCourseIds = (summaryResponse.data.enrolledCourses || []).map(c => c.id);
          const enrolled = enrolledCourseIds.includes(Number(courseId));
          setIsEnrolled(enrolled);
          
          // Load completed materials if enrolled
          if (enrolled) {
            try {
              const completedResponse = await apiGetCompletedMaterials(courseId);
              setCompletedMaterials(completedResponse.data.completedMaterialIds || []);
            } catch (e) {
              console.error('Could not fetch completed materials:', e);
            }
          }
        } catch (e) {
          console.error('Could not fetch enrollment status:', e);
          setIsEnrolled(false);
        }
      } else if (current?.role === 'admin' || current?.role === 'instructor') {
        // Admin and instructors can view all materials without enrollment
        setIsEnrolled(true);
      }
    } catch (err) {
      setError('Failed to load course');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizClick = async (quiz) => {
    try {
      setQuizLoading(true);
      setError('');
      const response = await apiGetQuiz(quiz.id);
      
      if (response.data) {
        setSelectedQuiz(response.data);
        setQuizAnswers({});
        if (response.data.message) {
          console.log(response.data.message);
        }
      } else {
        setError('Quiz data is incomplete. Please try again.');
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
      if (err.response?.status === 403) {
        setError('You are not enrolled in this course.');
      } else {
        setError('Failed to load quiz. Please try again.');
      }
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const response = await apiSubmitQuiz(selectedQuiz.id, quizAnswers);
      const { score, totalQuestions, percentage, passed } = response.data;
      alert(`Quiz submitted!\nScore: ${score}/${totalQuestions} (${percentage}%)\n${passed ? '✅ Passed!' : '❌ Try again'}`);
      setSelectedQuiz(null);
      loadCourseDetail();
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz. ' + (err.response?.data?.msg || ''));
    }
  };

  const handleViewMaterial = (material) => {
    if (!isEnrolled && current?.role === 'student') {
      setError('You must be enrolled to view materials.');
      return;
    }
    // Admin and instructor can always view
    setSelectedMaterial(material);
  };

  const handleMarkComplete = async (materialId) => {
    try {
      await apiMarkMaterialAsCompleted(materialId);
      setCompletedMaterials([...completedMaterials, materialId]);
      // Refresh course data to get updated progress
      loadCourseDetail();
    } catch (err) {
      console.error('Error marking material complete:', err);
      setError('Failed to mark material as complete');
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await apiEnrollCourse(courseId);
      setIsEnrolled(true);
      setError('');
      alert('Successfully enrolled in this course!');
    } catch (err) {
      const msg = err.response?.data?.msg || '';
      if (msg && msg.toLowerCase().includes('already enrolled')) {
        // If backend says already enrolled, mark as enrolled
        setIsEnrolled(true);
        setError('');
      } else {
        setError('Failed to enroll. ' + msg);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleMarkMaterialComplete = async (materialId) => {
    try {
      await apiMarkMaterialAsCompleted(materialId);
      // Reload course to update progress
      loadCourseDetail();
    } catch (err) {
      console.error('Error marking material as complete:', err);
    }
  };

  if (loading) return <div className="card"><p>Loading course...</p></div>;
  if (!course) return <div className="card"><p>Course not found</p></div>;

  const showEnrollment = current?.role === 'student' && !isEnrolled;

  return (
    <section className="card course-detail-page">
      <div className="detail-header">
        <div>
          <h1>{course.title}</h1>
          <p className="instructor-info">👨‍🏫 {course.instructor}</p>
        </div>
        <button className="btn secondary" onClick={() => navigate('/catalog')}>← Back to Catalog</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="course-info-section">
        <div className="course-description">
          <h3>📖 Course Description</h3>
          <p>{course.description}</p>
          <p className="course-level">
            <strong>Level:</strong> <span className="badge">{course.level}</span>
          </p>
        </div>

        {showEnrollment && (
          <div className="enrollment-prompt">
            <h3>Ready to Learn?</h3>
            <p>Enroll now to view materials and take quizzes</p>
            <button 
              className="btn primary enroll-btn"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? 'Enrolling...' : '✓ Enroll Now'}
            </button>
          </div>
        )}
      </div>

      {isEnrolled && materials.length > 0 && (
        <div className="materials-section">
          <h3 className="section-title">📚 Course Materials</h3>
          <div className="materials-grid">
            {materials.map(material => (
              <div key={material.id} className="material-card">
                <div className="material-icon">
                  <i className={`fa-solid ${
                    material.content?.includes('.pdf') ? 'fa-file-pdf' : 
                    material.content?.includes('.mp4') || material.content?.includes('youtube') || material.content?.includes('vimeo') ? 'fa-video' : 
                    'fa-file-text'
                  }`}></i>
                </div>
                <div className="material-info">
                  <h4>{material.title}</h4>
                  <p className="material-type">
                    {material.content?.includes('.pdf') ? 'PDF Document' : 
                     material.content?.includes('.mp4') ? 'Video' :
                     material.content?.includes('youtube') || material.content?.includes('vimeo') ? 'Embedded Video' :
                     'Learning Material'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="btn small material-btn"
                    onClick={() => handleViewMaterial(material)}
                    title="View this material"
                  >
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  {current?.role === 'student' && (
                    completedMaterials.includes(material.id) ? (
                      <span className="completed-badge" title="Completed">
                        <i className="fa-solid fa-check-circle"></i>
                      </span>
                    ) : (
                      <button
                        className="btn small primary"
                        onClick={() => handleMarkComplete(material.id)}
                        title="Mark as complete"
                      >
                        <i className="fa-solid fa-check"></i>
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isEnrolled && current?.role === 'student' && materials.length === 0 && (
        <div className="empty-state">
          <p>📚 Enroll to see course materials</p>
        </div>
      )}

      {quizzes.length > 0 && (current?.role === 'admin' || (current?.role === 'instructor' && isOwner)) && (
        <div className="quizzes-section">
          <h3 className="section-title">📝 Quizzes</h3>
          <div className="quizzes-list">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="quiz-card">
                <div className="quiz-header">
                  <h4>{quiz.title}</h4>
                  <span className="quiz-questions-count">
                    {quiz.Questions?.length || 0} questions
                  </span>
                </div>
                {quiz.Questions && quiz.Questions.length > 0 && (
                  <div className="quiz-questions-preview">
                    {quiz.Questions.map((question, idx) => {
                      const options = Array.isArray(question.options)
                        ? question.options
                        : (typeof question.options === 'string'
                            ? (() => {
                                try { return JSON.parse(question.options); }
                                catch { return question.options.split(','); }
                              })()
                            : []);
                      
                      // Ensure correctAnswer is a number for comparison
                      const correctAnswerIndex = typeof question.correctAnswer === 'string' 
                        ? parseInt(question.correctAnswer, 10) 
                        : question.correctAnswer;
                      
                      return (
                        <div key={question.id} className="question-preview">
                          <div className="question-preview-header">
                            <span className="question-number">Q{idx + 1}</span>
                          </div>
                          <p className="question-text">{question.question}</p>
                          <div className="options-list">
                            {options.map((option, optIdx) => {
                              const isCorrect = optIdx === correctAnswerIndex;
                              return (
                                <div key={optIdx} className={`option-item ${isCorrect ? 'correct-option' : ''}`}>
                                  <span className={`option-indicator ${isCorrect ? 'correct' : ''}`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="option-text">{option}</span>
                                  {isCorrect && (
                                    <span className="correct-badge">✓ Correct Answer</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {quizzes.length > 0 && current?.role === 'student' && isEnrolled && (
        <div className="quizzes-section">
          <h3 className="section-title">📝 Quizzes</h3>
          <div className="quizzes-list">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="quiz-card student-quiz-card">
                <div className="quiz-header">
                  <h4>{quiz.title}</h4>
                  <span className="quiz-questions-count">
                    {quiz.Questions?.length || 0} questions
                  </span>
                </div>
                <button
                  className="btn primary take-quiz-btn"
                  onClick={() => handleQuizClick(quiz)}
                  disabled={quizLoading}
                >
                  {quizLoading ? 'Loading...' : 'Take Quiz'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isEnrolled && current?.role === 'student' && quizzes.length === 0 && (
        <div className="empty-state">
          <p>📝 Enroll to see quizzes</p>
        </div>
      )}

      {selectedQuiz && (
        <div className="modal-overlay" onClick={() => setSelectedQuiz(null)}>
          <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedQuiz.title}</h2>
              <button className="modal-close" onClick={() => setSelectedQuiz(null)}>×</button>
            </div>
            <div className="quiz-content">
              {selectedQuiz.previousPercentage && (
                <div className="previous-attempt-info">
                  <p><strong>Previous Attempt:</strong> {selectedQuiz.previousPercentage}% ({selectedQuiz.previousScore}/{selectedQuiz.totalQuestions})</p>
                </div>
              )}
              {selectedQuiz.questions && selectedQuiz.questions.length > 0 ? (
                <>
                  <div className="questions-container">
                    {selectedQuiz.questions.map((q, idx) => (
                      <div key={q.id} className="question-block">
                        <div className="question-number">Q{idx + 1}</div>
                        <p className="question-text">{q.question}</p>
                        <div className="options-group">
                          {q.options && (
                            (Array.isArray(q.options)
                              ? q.options
                              : (typeof q.options === 'string'
                                  ? (() => {
                                      try { return JSON.parse(q.options); }
                                      catch { return q.options.split(','); }
                                    })()
                                  : [])
                            ).map((opt, optIdx) => (
                              <label key={optIdx} className={`option-label ${quizAnswers[q.id] === optIdx ? 'selected' : ''}`}>
                                <input
                                  type="radio"
                                  name={`q${q.id}`}
                                  value={optIdx}
                                  checked={quizAnswers[q.id] === optIdx}
                                  onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: parseInt(e.target.value) })}
                                />
                                <span className="option-text">{opt}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="quiz-actions">
                    <button className="btn primary submit-btn" onClick={handleSubmitQuiz}>
                      <i className="fa-solid fa-check"></i> Submit Quiz
                    </button>
                    <button className="btn secondary cancel-btn" onClick={() => setSelectedQuiz(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <p className="error-msg">No questions found in this quiz.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedMaterial && <MaterialModal material={selectedMaterial} onClose={() => setSelectedMaterial(null)} />}
    </section>
  );
}

export default CourseDetail;
