const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { Course, Quiz, Question, CourseMaterial, Attempt, User } = require('../models');


/* =========================
   CREATE COURSE
========================= */
router.post('/courses', auth, role('instructor','admin'), async (req, res) => {
  const { title, description, status } = req.body;

  const course = await Course.create({
    title,
    description,
    instructorId: req.user.id,
    status: status || 'published' // Default to 'published' so courses appear in catalog
  });

  res.json(course);
});

/* =========================
   UPDATE COURSE (INSTRUCTOR)
========================= */
router.put('/courses/:id', auth, role('instructor','admin'), async (req, res) => {
  const { title, description, status } = req.body;

  const course = await Course.findByPk(req.params.id);
  if (!course) {
    return res.status(404).json({ msg: 'Course not found' });
  }

  // Ensure instructor owns the course (admins can edit any course)
  if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
    return res.status(403).json({ msg: 'Not your course' });
  }

  course.title = title ?? course.title;
  course.description = description ?? course.description;
  if (status) {
    course.status = status;
  }

  await course.save();
  res.json(course);
});

/* =========================
   ADD MATERIAL
========================= */
router.post('/materials', auth, role('instructor','admin'), async (req, res) => {
  const { courseId, title, type, url } = req.body;

  const course = await Course.findByPk(courseId);
  if (!course) return res.status(404).json({ msg: 'Course not found' });

  if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
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
router.post('/quizzes', auth, role('instructor','admin'), async (req, res) => {
  const { courseId, title, questions } = req.body;

  const course = await Course.findByPk(courseId);
  if (!course) return res.status(404).json({ msg: 'Course not found' });

  if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
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
   GET QUIZ FOR EDITING
========================= */
router.get('/quizzes/:quizId', auth, role('instructor','admin'), async (req, res) => {
  const quiz = await Quiz.findByPk(req.params.quizId, {
    include: [{
      model: Course
    }, {
      model: Question
    }]
  });

  if (!quiz) {
    return res.status(404).json({ msg: 'Quiz not found' });
  }

  // Ensure instructor owns the course (admins can view any quiz)
  if (req.user.role !== 'admin' && quiz.Course.instructorId !== req.user.id) {
    return res.status(403).json({ msg: 'Not your quiz' });
  }

  res.json({
    id: quiz.id,
    title: quiz.title,
    courseId: quiz.CourseId,
    questions: quiz.Questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer
    }))
  });
});

/* =========================
   UPDATE QUIZ
========================= */
router.put('/quizzes/:quizId', auth, role('instructor','admin'), async (req, res) => {
  const { title, questions } = req.body;
  const quizId = req.params.quizId;

  const quiz = await Quiz.findByPk(quizId, {
    include: Course
  });

  if (!quiz) {
    return res.status(404).json({ msg: 'Quiz not found' });
  }

  // Ensure instructor owns the course (admins can update any quiz)
  if (req.user.role !== 'admin' && quiz.Course.instructorId !== req.user.id) {
    return res.status(403).json({ msg: 'Not your quiz' });
  }

  // Update quiz title
  if (title) {
    quiz.title = title;
    await quiz.save();
  }

  // Update questions if provided
  if (questions && Array.isArray(questions)) {
    // Delete existing questions
    await Question.destroy({ where: { QuizId: quizId } });

    // Create new questions
    for (const q of questions) {
      await Question.create({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        QuizId: quizId
      });
    }
  }

  res.json({
    msg: 'Quiz updated successfully',
    quizId: quiz.id
  });
});

/* =========================
   DELETE QUIZ
========================= */
router.delete('/quizzes/:quizId', auth, role('instructor','admin'), async (req, res) => {
  const quiz = await Quiz.findByPk(req.params.quizId, {
    include: Course
  });

  if (!quiz) {
    return res.status(404).json({ msg: 'Quiz not found' });
  }

  // Ensure instructor owns the course (admins can delete any quiz)
  if (req.user.role !== 'admin' && quiz.Course.instructorId !== req.user.id) {
    return res.status(403).json({ msg: 'Not your quiz' });
  }

  await Quiz.destroy({ where: { id: req.params.quizId } });
  res.json({ msg: 'Quiz deleted successfully' });
});

/* =========================
   VIEW QUIZ RESULTS (INSTRUCTOR)
========================= */
router.get('/quiz-results/:quizId', auth, role('instructor','admin'), async (req, res) => {
  const quizId = req.params.quizId;

  // Check quiz exists
  const quiz = await Quiz.findByPk(quizId, {
    include: Course
  });

  if (!quiz) {
    return res.status(404).json({ msg: 'Quiz not found' });
  }

  // Ensure instructor owns the course (admins can view any quiz results)
  if (req.user.role !== 'admin' && quiz.Course.instructorId !== req.user.id) {
    return res.status(403).json({ msg: 'Not your quiz' });
  }

  const attempts = await Attempt.findAll({
    where: { QuizId: quizId },
    attributes: ['score', 'createdAt'],
    include: {
      model: User,
      attributes: ['id', 'name', 'email']
    }
  });

  res.json({
    quizTitle: quiz.title,
    attempts: attempts.map(a => ({
      studentId: a.User.id,
      studentName: a.User.name,
      studentEmail: a.User.email,
      score: a.score,
      attemptedAt: a.createdAt
    }))
  });
});

/* =========================
   INSTRUCTOR ANALYTICS
========================= */
router.get('/analytics', auth, role('instructor','admin'), async (req, res) => {
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
