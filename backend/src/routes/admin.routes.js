const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { Course, CourseMaterial, Attempt, Quiz } = require('../models');


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
  const courses = await Course.findAll();
  res.json(courses);
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
      }
    ]
  });

  const analytics = quizzes.map(q => ({
    quizId: q.id,
    title: q.title,
    totalAttempts: q.Attempts.length,
    averageScore:
      q.Attempts.length === 0
        ? 0
        : q.Attempts.reduce((sum, a) => sum + a.score, 0) /
          q.Attempts.length
  }));

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



module.exports = router;
