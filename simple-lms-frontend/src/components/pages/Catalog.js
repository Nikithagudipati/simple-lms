import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGetCourses, apiEnrollCourse, apiGetStudentSummary } from '../../utils/api';

function Catalog() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { current } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    performSearch();
  }, [searchTerm, filterLevel, courses]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await apiGetCourses();
      let coursesList = response.data;

      // Fetch enrolled courses if student
      if (current?.role === 'student') {
        try {
          const enrollResponse = await apiGetStudentSummary();
          const enrolledCourseIds = new Set(enrollResponse.data.enrolledCourses.map(c => c.id));
          setEnrolledIds(enrolledCourseIds);
        } catch (e) {
          console.error('Error fetching enrollment status:', e);
        }
      }

      // Transform data and normalize instructor
      coursesList = coursesList.map(course => ({
        ...course,
        level: course.level || 'intermediate',
        enrolled: enrolledIds.has(course.id),
        instructor: course.Instructor?.name || course.instructor || course.User?.name || 'No Instructor'
      }));

      setCourses(coursesList);
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = () => {
    let filtered = courses.filter(c => {
      const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = filterLevel === 'all' || c.level === filterLevel;
      return matchesSearch && matchesLevel;
    });
    setFilteredCourses(filtered);
  };

  const handleEnroll = async (courseId) => {
    try {
      await apiEnrollCourse(courseId);
      setEnrolledIds(new Set([...enrolledIds, courseId]));
      // Refresh courses
      await loadCourses();
    } catch (err) {
      setError('Failed to enroll in course');
      console.error(err);
    }
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) return <div className="card"><p>Loading courses...</p></div>;

  return (
    <section className="card">
      <div className="page-header">
        <div>
          <h2><i className="fa-solid fa-book"></i> Course Catalog</h2>
          <p className="muted">Browse available courses. Instructors manage their own courses and quizzes.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            className="search"
            placeholder="Search title or description..."
            autoComplete="off"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="search"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="all">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="grid">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <div key={course.id} className="course-card">
              <h4>{course.title}</h4>
              <p className="small muted">{course.instructor || 'No Instructor'} • {course.level}</p>
              <p>{course.description}</p>
              <div className="course-actions" style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCourseClick(course.id);
                  }}
                >
                  <i className="fa-solid fa-eye"></i> View
                </button>
                {current?.role === 'student' && (
                  enrolledIds.has(course.id) ? (
                    <button className="btn small" disabled style={{ opacity: 0.5 }}>
                      <i className="fa-solid fa-check"></i> Enrolled
                    </button>
                  ) : (
                    <button
                      className="btn small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnroll(course.id);
                      }}
                    >
                      <i className="fa-solid fa-plus"></i> Enroll
                    </button>
                  )
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="muted">No courses found</p>
        )}
      </div>
    </section>
  );
}

export default Catalog;
