const router = require('express').Router();
const { Course } = require('../models');

router.get('/', async (req, res) => {
  const courses = await Course.findAll({
    where: { status: 'published' }
  });
  res.json(courses);
});

module.exports = router;
