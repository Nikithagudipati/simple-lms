import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('lms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiLogin = (email, password) =>
  apiClient.post('/auth/login', { email, password });

export const apiGetCourses = () => apiClient.get('/courses');

export const apiEnrollCourse = (courseId) =>
  apiClient.post('/student/enroll', { courseId });

export const apiGetStudentSummary = () => apiClient.get('/student/summary');

export const apiGetCourseDetail = (courseId) =>
  apiClient.get(`/courses/${courseId}`);

export const apiTrackCourseTime = (courseId, minutes) =>
  apiClient.post(`/student/track-time`, { courseId, minutes });

export const apiGetQuiz = (quizId) => apiClient.get(`/student/quiz/${quizId}`);

export const apiSubmitQuiz = (quizId, answers) =>
  apiClient.post(`/student/quiz/${quizId}/submit`, { answers });

export const apiGetInstructorCourses = () =>
  apiClient.get('/instructor/courses');

export const apiCreateCourse = (courseData) =>
  apiClient.post('/instructor/courses', courseData);

export const apiCreateQuiz = (courseId, quizData) =>
  apiClient.post(`/instructor/courses/${courseId}/quizzes`, quizData);

export const apiGetAdminStats = () => apiClient.get('/admin/analytics');

export const apiGetAllUsers = () => apiClient.get('/admin/users');

export const apiDeleteUser = (userId) =>
  apiClient.delete(`/admin/users/${userId}`);

export const apiDeleteCourse = (courseId) =>
  apiClient.delete(`/instructor/courses/${courseId}`);

export const apiUpdateCourse = (courseId, courseData) =>
  apiClient.put(`/instructor/courses/${courseId}`, courseData);

export const apiGetPendingQuizzes = () =>
  apiClient.get('/student/pending-quizzes');

export const apiCreateUser = (userData) =>
  apiClient.post('/admin/users', userData);

export const apiImpersonateUser = (userId) =>
  apiClient.post(`/admin/impersonate/${userId}`);

export const apiDeleteQuiz = (quizId) =>
  apiClient.delete(`/instructor/quizzes/${quizId}`);

export const apiGetQuizAttempts = (quizId) =>
  apiClient.get(`/quizzes/${quizId}/attempts`);

export const apiGetAllCourses = () =>
  apiClient.get('/admin/courses');

export const apiResetPassword = (userId, newPassword) =>
  apiClient.post(`/admin/users/${userId}/reset-password`, { newPassword });

export const apiGetPendingQuizzesData = () =>
  apiClient.get('/student/pending-quizzes');

export const apiGetQuizScoresByCourse = () =>
  apiClient.get('/student/quiz-scores-by-course');

export const apiMarkMaterialAsCompleted = (materialId) =>
  apiClient.post(`/student/materials/${materialId}/complete`);

export const apiGetCompletedMaterials = (courseId) =>
  apiClient.get(`/student/course/${courseId}/completed-materials`);

export const apiGetCourseProgress = (courseId) =>
  apiClient.get(`/student/course-progress/${courseId}`);

// Admin course endpoints
export const apiAdminCreateCourse = (courseData) =>
  apiClient.post('/admin/courses', courseData);

export const apiAdminUpdateCourse = (courseId, courseData) =>
  apiClient.put(`/admin/courses/${courseId}`, courseData);

export const apiAdminCreateQuiz = (quizData) =>
  apiClient.post('/admin/quizzes', quizData);

export const apiAdminUpdateQuiz = (quizId, quizData) =>
  apiClient.put(`/admin/quizzes/${quizId}`, quizData);

export const apiAdminDeleteQuiz = (quizId) =>
  apiClient.delete(`/admin/quizzes/${quizId}`);

export const apiAdminGetQuiz = (quizId) =>
  apiClient.get(`/admin/quizzes/${quizId}`);

export const apiGetCourseStudents = (courseId) =>
  apiClient.get(`/instructor/courses/${courseId}/students`);

export default apiClient;
