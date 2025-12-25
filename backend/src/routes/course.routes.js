const router = require('express').Router();
const { Course, CourseMaterial, Quiz, Question, User } = require('../models');

router.get('/', async (req, res) => {
  const courses = await Course.findAll({
    where: { status: 'published' },
    include: [
      {
        model: CourseMaterial,
        attributes: ['id', 'title', 'type', 'url']
      },
      {
        model: Quiz,
        attributes: ['id', 'title'],
        include: [{
          model: Question,
          attributes: ['id', 'question', 'options', 'correctAnswer']
        }]
      },
      {
        model: User,
        as: 'Instructor',
        attributes: ['id', 'name', 'email']
      }
    ]
  });
  res.json(courses);
});

router.get('/:id', async (req, res) => {
  const course = await Course.findByPk(req.params.id, {
    include: [
      {
        model: CourseMaterial,
        attributes: ['id', 'title', 'type', 'url']
      },
      {
        model: Quiz,
        attributes: ['id', 'title'],
        include: [{
          model: Question,
          attributes: ['id', 'question', 'options', 'correctAnswer']
        }]
      },
      {
        model: User,
        as: 'Instructor',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  if (!course) {
    return res.status(404).json({ msg: 'Course not found' });
  }

  res.json(course);
});

module.exports = router;
