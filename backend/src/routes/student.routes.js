const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { Enrollment, Course, CourseMaterial, Quiz, Question, Attempt } = require('../models');

/* =========================
   STUDENT DASHBOARD
========================= */
router.get('/dashboard', auth, role('student'), (req, res) => {
  res.json({ msg: 'Welcome Student Dashboard' });
});

/* =========================
   ENROLL IN COURSE
========================= */
router.post('/enroll', auth, role('student'), async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findByPk(courseId);
  if (!course) {
    return res.status(404).json({ msg: 'Course not found' });
  }

  const exists = await Enrollment.findOne({
    where: { UserId: req.user.id, CourseId: courseId }
  });

  if (exists) {
    return res.status(400).json({ msg: 'Already enrolled' });
  }

  const enrollment = await Enrollment.create({
    UserId: req.user.id,
    CourseId: courseId,
    progress: 0,
    completed: false
  });

  res.json(enrollment);
});

/* =========================
   VIEW QUIZZES FOR COURSE
========================= */
router.get('/quizzes/:courseId', auth, role('student'), async (req, res) => {
  const enrolled = await Enrollment.findOne({
    where: {
      UserId: req.user.id,
      CourseId: req.params.courseId
    }
  });

  if (!enrolled) {
    return res.status(403).json({ msg: 'Not enrolled in this course' });
  }

  const quizzes = await Quiz.findAll({
    where: { CourseId: req.params.courseId },
    attributes: ['id', 'title']
  });

  res.json(quizzes);
});

/* =========================
   ATTEMPT QUIZ (NO REATTEMPTS)
========================= */
router.post('/attempt-quiz', auth, role('student'), async (req, res) => {
  const { quizId, answers } = req.body;

  const attempted = await Attempt.findOne({
    where: { UserId: req.user.id, QuizId: quizId }
  });

  if (attempted) {
    return res.status(400).json({ msg: 'Quiz already attempted' });
  }

  const questions = await Question.findAll({
    where: { QuizId: quizId }
  });

  let score = 0;
  questions.forEach(q => {
    if (answers[q.id] === q.correctAnswer) score++;
  });

  await Attempt.create({
    UserId: req.user.id,
    QuizId: quizId,
    score
  });

  res.json({ score, total: questions.length });
});
/* =========================
   STUDENT DASHBOARD SUMMARY
========================= */
router.get('/summary', auth, role('student'), async (req, res) => {
  const userId = req.user.id;

  const enrollments = await Enrollment.findAll({
    where: { UserId: userId },
    include: Course
  });

  const attempts = await Attempt.findAll({
    where: { UserId: userId }
  });

  const completedCourses = enrollments.filter(e => e.completed).length;
  const pendingCourses = enrollments.length - completedCourses;

  const avgScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
        )
      : 0;

  res.json({
    enrolledCourses: enrollments,
    completedCourses,
    pendingCourses,
    averageScore: avgScore
  });
});


module.exports = router;
