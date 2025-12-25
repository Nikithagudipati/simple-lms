const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { Course, Quiz, Question, CourseMaterial, Attempt, User } = require('../models');


/* =========================
   CREATE COURSE
========================= */
router.post('/courses', auth, role('instructor'), async (req, res) => {
  const { title, description } = req.body;

  const course = await Course.create({
    title,
    description,
    instructorId: req.user.id,
    status: 'draft'
  });

  res.json(course);
});

/* =========================
   ADD MATERIAL
========================= */
router.post('/materials', auth, role('instructor'), async (req, res) => {
  const { courseId, title, type, url } = req.body;

  const course = await Course.findByPk(courseId);
  if (!course) return res.status(404).json({ msg: 'Course not found' });

  if (course.instructorId !== req.user.id) {
    return res.status(403).json({ msg: 'Not your course' });
  }

  const material = await CourseMaterial.create({
    CourseId: courseId,
    title,
    type,
    url
  });

  res.json(material);
});

/* =========================
   CREATE QUIZ + QUESTIONS
========================= */
router.post('/quizzes', auth, role('instructor'), async (req, res) => {
  const { courseId, title, questions } = req.body;

  const course = await Course.findByPk(courseId);
  if (!course) return res.status(404).json({ msg: 'Course not found' });

  if (course.instructorId !== req.user.id) {
    return res.status(403).json({ msg: 'Not your course' });
  }

  const quiz = await Quiz.create({
    title,
    CourseId: courseId
  });

  for (const q of questions) {
    await Question.create({
      question: q.question,
      options: q.options,       // ARRAY IS OK
      correctAnswer: q.correctAnswer,
      QuizId: quiz.id
    });
  }

  res.json({
    msg: 'Quiz created successfully',
    quizId: quiz.id
  });
});
/* =========================
   VIEW QUIZ RESULTS (INSTRUCTOR)
========================= */
router.get('/quiz-results/:quizId', auth, role('instructor'), async (req, res) => {
  const quizId = req.params.quizId;

  // Check quiz exists
  const quiz = await Quiz.findByPk(quizId, {
    include: Course
  });

  if (!quiz) {
    return res.status(404).json({ msg: 'Quiz not found' });
  }

  // Ensure instructor owns the course
  if (quiz.Course.instructorId !== req.user.id) {
    return res.status(403).json({ msg: 'Not your quiz' });
  }

  const attempts = await Attempt.findAll({
    where: { QuizId: quizId },
    attributes: ['score', 'createdAt'],
    include: {
      model: require('../models').User,
      attributes: ['id', 'name', 'email']
    }
  });

  res.json(attempts);
});

/* =========================
   VIEW QUIZ RESULTS (INSTRUCTOR)
========================= */
router.get('/quiz-results/:quizId', auth, role('instructor'), async (req, res) => {
  const quizId = req.params.quizId;

  const quiz = await Quiz.findByPk(quizId, {
    include: [
      {
        model: Attempt,
        include: ['User']
      }
    ]
  });

  if (!quiz) {
    return res.status(404).json({ msg: 'Quiz not found' });
  }

  res.json({
    quizTitle: quiz.title,
    attempts: quiz.Attempts.map(a => ({
      studentId: a.UserId,
      studentName: a.User?.name,
      score: a.score
    }))
  });
});

/* =========================
   INSTRUCTOR ANALYTICS
========================= */
router.get('/analytics', auth, role('instructor'), async (req, res) => {
  const instructorId = req.user.id;

  const courses = await Course.findAll({
    where: { instructorId },
    include: [
      {
        model: Quiz,
        include: [Question]
      }
    ]
  });

  const analytics = [];

  for (const course of courses) {
    const enrollments = await course.getUsers();
    const quizzes = course.Quizzes || [];

    let totalScore = 0;
    let totalAttempts = 0;

    for (const quiz of quizzes) {
      const attempts = await quiz.getAttempts();
      attempts.forEach(a => {
        totalScore += a.score;
        totalAttempts++;
      });
    }

    analytics.push({
      courseId: course.id,
      courseTitle: course.title,
      studentsEnrolled: enrollments.length,
      averageScore: totalAttempts ? (totalScore / totalAttempts).toFixed(2) : 0
    });
  }

  res.json(analytics);
});



module.exports = router;
