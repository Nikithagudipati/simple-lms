const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { Course, CourseMaterial, Attempt, Quiz, Question } = require('../models');


// Admin creates course
router.post('/courses', auth, role('admin'), async (req, res) => {
  const { title, description, instructorId } = req.body;

  const course = await Course.create({
    title,
    description,
    instructorId,
    status: 'published'
  });

  res.json(course);
});

// Admin views all courses
router.get('/courses', auth, role('admin'), async (req, res) => {
  const courses = await Course.findAll({
    include: [
      {
        model: require('../models').User,
        as: 'Instructor',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Quiz,
        attributes: ['id', 'title']
      },
      {
        model: require('../models').Enrollment,
        attributes: ['id']
      }
    ]
  });
  res.json(courses);
});

// Admin views all users
router.get('/users', auth, role('admin'), async (req, res) => {
  const users = await require('../models').User.findAll({
    attributes: ['id', 'name', 'email', 'role', 'createdAt'],
    order: [['createdAt', 'DESC']]
  });
  res.json(users);
});

// Admin creates user
router.post('/users', auth, role('admin'), async (req, res) => {
  const bcrypt = require('bcrypt');
  const { name, email, password, role: userRole } = req.body;

  if (!name || !email || !password || !userRole) {
    return res.status(400).json({ msg: 'Name, email, password, and role are required' });
  }

  // Validate role
  if (!['admin', 'instructor', 'student'].includes(userRole)) {
    return res.status(400).json({ msg: 'Invalid role. Must be admin, instructor, or student' });
  }

  // Check if user already exists
  const existingUser = await require('../models').User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ msg: 'User with this email already exists' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await require('../models').User.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: userRole
  });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

// Admin deletes user
router.delete('/users/:id', auth, role('admin'), async (req, res) => {
  const userId = req.params.id;
  
  // Prevent admin from deleting themselves
  if (Number(userId) === req.user.id) {
    return res.status(400).json({ msg: 'Cannot delete your own account' });
  }
  
  await require('../models').User.destroy({ where: { id: userId } });
  res.json({ msg: 'User deleted' });
});

// Admin updates course
router.put('/courses/:id', auth, role('admin'), async (req, res) => {
  const { title, description, status, instructorId } = req.body;

  const course = await Course.findByPk(req.params.id);
  if (!course) {
    return res.status(404).json({ msg: 'Course not found' });
  }

  course.title = title ?? course.title;
  course.description = description ?? course.description;
  course.status = status ?? course.status;
  course.instructorId = instructorId ?? course.instructorId;

  await course.save();
  res.json(course);
});

// Admin deletes course
router.delete('/courses/:id', auth, role('admin'), async (req, res) => {
  await Course.destroy({ where: { id: req.params.id } });
  res.json({ msg: 'Course deleted' });
});

// Admin adds material to any course
router.post('/materials', auth, role('admin'), async (req, res) => {
  const { courseId, title, type, url } = req.body;

  const course = await Course.findByPk(courseId);
  if (!course) {
    return res.status(404).json({ msg: 'Course not found' });
  }

  const material = await CourseMaterial.create({
    CourseId: courseId,
    title,
    type,
    url
  });

  res.json(material);
});

// Admin updates course material
router.put('/materials/:id', auth, role('admin'), async (req, res) => {
  const { title, type, url } = req.body;

  const material = await CourseMaterial.findByPk(req.params.id);
  if (!material) {
    return res.status(404).json({ msg: 'Material not found' });
  }

  material.title = title ?? material.title;
  material.type = type ?? material.type;
  material.url = url ?? material.url;

  await material.save();
  res.json(material);
});
/* =========================
   VIEW ALL QUIZ ATTEMPTS (ADMIN)
========================= */
router.get('/quiz-attempts', auth, role('admin'), async (req, res) => {
  const attempts = await Attempt.findAll({
    include: {
      model: Quiz,
      attributes: ['title']
    }
  });

  res.json(attempts);
});
/* =========================
   QUIZ ANALYTICS (ADMIN)
========================= */
router.get('/quiz-analytics', auth, role('admin'), async (req, res) => {
  const quizzes = await Quiz.findAll({
    include: [
      {
        model: Attempt
      },
      {
        model: Question
      }
    ]
  });

  const analytics = quizzes.map(q => {
    const totalQuestions = q.Questions ? q.Questions.length : 0;
    const attempts = q.Attempts || [];
    
    let avgScore = 0;
    if (attempts.length > 0 && totalQuestions > 0) {
      const totalPercentage = attempts.reduce((sum, a) => {
        // Calculate percentage: (score / totalQuestions) * 100
        return sum + (a.score / totalQuestions) * 100;
      }, 0);
      avgScore = totalPercentage / attempts.length;
    }
    
    return {
      quizId: q.id,
      title: q.title,
      totalAttempts: attempts.length,
      averageScore: Math.round(avgScore * 100) / 100 // Round to 2 decimal places
    };
  });

  res.json(analytics);
});

/* =========================
   ADMIN ANALYTICS
========================= */
router.get('/analytics', auth, role('admin'), async (req, res) => {
  const totalUsers = await require('../models').User.count();
  const totalCourses = await Course.count();
  const totalEnrollments = await require('../models').Enrollment.count();
  const totalAttempts = await require('../models').Attempt.count();

  const avgScore = await require('../models').Attempt.findAll({
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').col('score')), 'avgScore']
    ]
  });

  res.json({
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalQuizAttempts: totalAttempts,
    averageQuizScore: avgScore[0].dataValues.avgScore || 0
  });
});

/* =========================
   ADMIN: CREATE QUIZ
========================= */
router.post('/quizzes', auth, role('admin'), async (req, res) => {
  const { courseId, title, questions } = req.body;

  const course = await Course.findByPk(courseId);
  if (!course) {
    return res.status(404).json({ msg: 'Course not found' });
  }

  const quiz = await Quiz.create({
    title,
    CourseId: courseId
  });

  for (const q of questions) {
    await Question.create({
      question: q.question,
      options: q.options,
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
   ADMIN: GET QUIZ FOR EDITING
========================= */
router.get('/quizzes/:quizId', auth, role('admin'), async (req, res) => {
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
   ADMIN: UPDATE QUIZ
========================= */
router.put('/quizzes/:quizId', auth, role('admin'), async (req, res) => {
  const { title, questions } = req.body;
  const quizId = req.params.quizId;

  const quiz = await Quiz.findByPk(quizId);

  if (!quiz) {
    return res.status(404).json({ msg: 'Quiz not found' });
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
   ADMIN: DELETE QUIZ
========================= */
router.delete('/quizzes/:quizId', auth, role('admin'), async (req, res) => {
  const quiz = await Quiz.findByPk(req.params.quizId);

  if (!quiz) {
    return res.status(404).json({ msg: 'Quiz not found' });
  }

  await Quiz.destroy({ where: { id: req.params.quizId } });
  res.json({ msg: 'Quiz deleted successfully' });
});



module.exports = router;
