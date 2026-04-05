const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { Course, Quiz, Question, CourseMaterial, Attempt, User, Enrollment } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|mp4|avi|mov|mkv|doc|docx|ppt|pptx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Allowed: PDF, Videos, Documents, Images'));
  }
});


/* =========================
   GET INSTRUCTOR COURSES
========================= */
router.get('/courses', auth, role('instructor','admin'), async (req, res) => {
  try {
    const instructorId = req.user.id;
    
    const courses = await Course.findAll({
      where: { instructorId },
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
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Add attempt counts for each course
    const coursesWithAttempts = await Promise.all(courses.map(async (course) => {
      const courseJson = course.toJSON();
      
      // Count total attempts across all quizzes in this course
      let totalAttempts = 0;
      if (courseJson.Quizzes && courseJson.Quizzes.length > 0) {
        for (const quiz of courseJson.Quizzes) {
          const attemptCount = await Attempt.count({ where: { QuizId: quiz.id } });
          totalAttempts += attemptCount;
        }
      }
      
      return {
        ...courseJson,
        attemptCount: totalAttempts
      };
    }));
    
    res.json(coursesWithAttempts);
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({ msg: 'Failed to fetch courses' });
  }
});

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
   DELETE COURSE (INSTRUCTOR)
========================= */
router.delete('/courses/:id', auth, role('instructor','admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Ensure instructor owns the course (admins can delete any course)
    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return res.status(403).json({ msg: 'Not your course' });
    }

    await course.destroy();
    res.json({ msg: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ msg: 'Failed to delete course' });
  }
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
   UPLOAD FILE MATERIAL
========================= */
router.post('/materials/upload', auth, role('instructor','admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const { courseId, title } = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return res.status(403).json({ msg: 'Not your course' });
    }

    // Determine type based on file extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    let type = 'document';
    if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) {
      type = 'video';
    } else if (['.pdf'].includes(ext)) {
      type = 'pdf';
    }

    // Create material with file path
    const fileUrl = `/uploads/${req.file.filename}`;
    const material = await CourseMaterial.create({
      CourseId: courseId,
      title: title || req.file.originalname,
      type,
      url: fileUrl
    });

    res.json(material);
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ msg: 'Failed to upload file' });
  }
});

// Delete material
router.delete('/materials/:materialId', auth, role('instructor', 'admin'), async (req, res) => {
  try {
    const materialId = req.params.materialId;
    const material = await CourseMaterial.findByPk(materialId, {
      include: [{ model: Course, attributes: ['InstructorId'] }]
    });

    if (!material) {
      return res.status(404).json({ msg: 'Material not found' });
    }

    // Check ownership (instructors can only delete their own course materials)
    if (req.user.role === 'instructor' && material.Course.InstructorId !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // If material is an uploaded file, delete the file from disk
    if (material.url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../uploads', path.basename(material.url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await material.destroy();
    res.json({ msg: 'Material deleted successfully' });
  } catch (err) {
    console.error('Error deleting material:', err);
    res.status(500).json({ msg: 'Failed to delete material' });
  }
});

/* =========================
   CREATE QUIZ + QUESTIONS
========================= */
router.post('/courses/:courseId/quizzes', auth, role('instructor','admin'), async (req, res) => {
  const { title, questions } = req.body;
  const courseId = req.params.courseId;

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

/* =========================
   GET COURSE STUDENTS WITH STATISTICS
========================= */
router.get('/courses/:courseId/students', auth, role('instructor','admin'), async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const instructorId = req.user.id;

    // Verify course exists and belongs to instructor
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: Quiz,
          include: [Question]
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructorId !== instructorId) {
      return res.status(403).json({ msg: 'Not your course' });
    }

    // Get all enrolled students
    const enrollments = await Enrollment.findAll({
      where: { CourseId: courseId },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });

    // Build statistics for each student
    const studentsStats = await Promise.all(enrollments.map(async (enrollment) => {
      const student = enrollment.User;
      const quizzes = course.Quizzes || [];

      let totalAttempts = 0;
      let totalScore = 0;
      let quizDetails = [];

      for (const quiz of quizzes) {
        const attempts = await Attempt.findAll({
          where: {
            UserId: student.id,
            QuizId: quiz.id
          },
          order: [['createdAt', 'DESC']]
        });

        if (attempts.length > 0) {
          const latestAttempt = attempts[0];
          const totalQuestions = quiz.Questions.length;
          const percentage = totalQuestions > 0 ? ((latestAttempt.score / totalQuestions) * 100).toFixed(1) : 0;

          quizDetails.push({
            quizId: quiz.id,
            quizTitle: quiz.title,
            attempts: attempts.length,
            latestScore: latestAttempt.score,
            totalQuestions: totalQuestions,
            percentage: percentage,
            lastAttemptDate: latestAttempt.createdAt
          });

          totalAttempts += attempts.length;
          totalScore += latestAttempt.score;
        }
      }

      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        enrolledAt: enrollment.createdAt,
        totalAttempts: totalAttempts,
        quizzes: quizDetails,
        averageScore: quizDetails.length > 0 
          ? (quizDetails.reduce((sum, q) => sum + parseFloat(q.percentage), 0) / quizDetails.length).toFixed(1)
          : 0
      };
    }));

    res.json({
      courseId: course.id,
      courseTitle: course.title,
      totalStudents: studentsStats.length,
      students: studentsStats
    });
  } catch (error) {
    console.error('Error fetching course students:', error);
    res.status(500).json({ msg: 'Failed to fetch course students' });
  }
});



module.exports = router;
