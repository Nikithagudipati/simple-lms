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
    attributes: ['id', 'title'],
    include: [{
      model: Question,
      attributes: ['id', 'question', 'options', 'correctAnswer']
    }]
  });

  // Get attempt information for each quiz
  const quizzesWithAttempts = await Promise.all(quizzes.map(async (quiz) => {
    const attempt = await Attempt.findOne({
      where: {
        UserId: req.user.id,
        QuizId: quiz.id
      }
    });

    const quizData = {
      id: quiz.id,
      title: quiz.title,
      totalQuestions: quiz.Questions?.length || 0
    };

    if (attempt) {
      const percentage = quizData.totalQuestions > 0 
        ? Math.round((attempt.score / quizData.totalQuestions) * 100)
        : 0;
      
      quizData.attempted = true;
      quizData.score = attempt.score;
      quizData.totalQuestions = quizData.totalQuestions;
      quizData.percentage = percentage;
      quizData.canRetake = percentage < 100;
    } else {
      quizData.attempted = false;
      quizData.score = null;
      quizData.percentage = null;
      quizData.canRetake = false;
    }

    return quizData;
  }));

  res.json(quizzesWithAttempts);
});

/* =========================
   GET QUIZ QUESTIONS
========================= */
router.get('/quiz/:quizId/questions', auth, role('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }

    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      where: {
        UserId: req.user.id,
        CourseId: quiz.CourseId
      }
    });

    if (!enrollment) {
      return res.status(403).json({ msg: 'Not enrolled in this course' });
    }

    const questions = await Question.findAll({
      where: { QuizId: req.params.quizId },
      attributes: ['id', 'question', 'options', 'correctAnswer']
    });

    const totalQuestions = questions.length;

    // Check if already attempted - allow retake if score < 100%
    const attempted = await Attempt.findOne({
      where: { UserId: req.user.id, QuizId: req.params.quizId }
    });

    let allowRetake = false;
    let previousScore = null;
    let previousPercentage = null;

    if (attempted) {
      const score = attempted.score;
      const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
      
      // Only block if they got 100%
      if (percentage >= 100) {
        return res.status(400).json({ 
          msg: 'Quiz already completed with perfect score',
          previousScore: score,
          totalQuestions: totalQuestions,
          percentage: Math.round(percentage)
        });
      }
      
      // Allow retake - but still return questions
      allowRetake = true;
      previousScore = score;
      previousPercentage = Math.round(percentage);
    }

    res.json({
      quizId: quiz.id,
      quizTitle: quiz.title,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer
      })),
      allowRetake: allowRetake,
      previousScore: previousScore,
      previousPercentage: previousPercentage
    });
  } catch (error) {
    console.error('Error in quiz questions endpoint:', error);
    res.status(500).json({ msg: 'Server error: ' + error.message });
  }
});

/* =========================
   ATTEMPT QUIZ (ALLOW RETAKES IF SCORE < 100%)
========================= */
router.post('/attempt-quiz', auth, role('student'), async (req, res) => {
  const { quizId, answers } = req.body;

  // Get quiz and course info
  const quiz = await Quiz.findByPk(quizId, {
    include: [{
      model: Question
    }]
  });
  
  if (!quiz) {
    return res.status(404).json({ msg: 'Quiz not found' });
  }

  const questions = quiz.Questions || [];
  const totalQuestions = questions.length;

  // Check if already attempted
  const previousAttempt = await Attempt.findOne({
    where: { UserId: req.user.id, QuizId: quizId }
  });

  if (previousAttempt) {
    const previousScore = previousAttempt.score;
    const previousPercentage = totalQuestions > 0 ? (previousScore / totalQuestions) * 100 : 0;
    
    // Only allow retake if previous score was < 100%
    if (previousPercentage >= 100) {
      return res.status(400).json({ 
        msg: 'Quiz already completed with perfect score. Cannot retake.',
        previousScore: previousScore,
        totalQuestions: totalQuestions
      });
    }
    
    // Delete previous attempt to allow retake
    await Attempt.destroy({
      where: { UserId: req.user.id, QuizId: quizId }
    });
  }

  // Calculate new score
  let score = 0;
  questions.forEach(q => {
    // Convert both to strings for comparison (answers come as strings from frontend)
    const userAnswer = String(answers[q.id] || '');
    const correctAnswer = String(q.correctAnswer);
    if (userAnswer === correctAnswer) score++;
  });

  // Create new attempt
  await Attempt.create({
    UserId: req.user.id,
    QuizId: quizId,
    score
  });

  // Update enrollment progress
  const enrollment = await Enrollment.findOne({
    where: {
      UserId: req.user.id,
      CourseId: quiz.CourseId
    }
  });

  if (enrollment) {
    // Get total quizzes for the course
    const totalQuizzes = await Quiz.count({
      where: { CourseId: quiz.CourseId }
    });

    if (totalQuizzes > 0) {
      // Get all quiz IDs for this course
      const courseQuizzes = await Quiz.findAll({
        where: { CourseId: quiz.CourseId },
        attributes: ['id']
      });
      const quizIds = courseQuizzes.map(q => q.id);

      // Count unique quizzes attempted by this user
      const attempts = await Attempt.findAll({
        where: {
          UserId: req.user.id,
          QuizId: quizIds
        },
        attributes: ['QuizId'],
        raw: true
      });

      // Get unique quiz IDs from attempts
      const uniqueQuizIds = [...new Set(attempts.map(a => a.QuizId))];
      const completedQuizzesCount = uniqueQuizIds.length;

      // Calculate progress percentage
      const progress = Math.round((completedQuizzesCount / totalQuizzes) * 100);

      enrollment.progress = progress;
      
      // Mark as completed if all quizzes are done
      enrollment.completed = progress >= 100;
      
      await enrollment.save();
    }
  }

  res.json({ score, total: questions.length });
});
/* =========================
   TRACK TIME SPENT ON COURSE
========================= */
router.post('/track-time', auth, role('student'), async (req, res) => {
  const { courseId, minutes } = req.body;

  if (!courseId || !minutes || minutes < 0) {
    return res.status(400).json({ msg: 'Invalid courseId or minutes' });
  }

  const enrollment = await Enrollment.findOne({
    where: {
      UserId: req.user.id,
      CourseId: courseId
    }
  });

  if (!enrollment) {
    return res.status(403).json({ msg: 'Not enrolled in this course' });
  }

  enrollment.timeSpent = (enrollment.timeSpent || 0) + minutes;
  await enrollment.save();

  res.json({ 
    msg: 'Time tracked successfully',
    totalTimeSpent: enrollment.timeSpent
  });
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

  // Recalculate progress for each enrollment
  for (const enrollment of enrollments) {
    const totalQuizzes = await Quiz.count({
      where: { CourseId: enrollment.CourseId }
    });

    if (totalQuizzes > 0) {
      // Get all quiz IDs for this course
      const courseQuizzes = await Quiz.findAll({
        where: { CourseId: enrollment.CourseId },
        attributes: ['id']
      });
      const quizIds = courseQuizzes.map(q => q.id);

      // Count unique quizzes attempted by this user
      const attempts = await Attempt.findAll({
        where: {
          UserId: userId,
          QuizId: quizIds
        },
        attributes: ['QuizId'],
        raw: true
      });

      // Get unique quiz IDs from attempts
      const uniqueQuizIds = [...new Set(attempts.map(a => a.QuizId))];
      const completedQuizzesCount = uniqueQuizIds.length;

      // Calculate progress percentage
      const progress = Math.round((completedQuizzesCount / totalQuizzes) * 100);
      
      enrollment.progress = progress;
      enrollment.completed = progress >= 100;
      await enrollment.save();
    } else {
      // No quizzes in course, progress is 0
      enrollment.progress = 0;
      enrollment.completed = false;
      await enrollment.save();
    }
  }

  // Get all attempts with quiz and question data for average score calculation
  const attempts = await Attempt.findAll({
    where: { UserId: userId },
    include: [{
      model: Quiz,
      include: [{
        model: Question
      }]
    }]
  });

  // Calculate average score as percentage
  let totalScore = 0;
  let totalQuestions = 0;
  attempts.forEach(attempt => {
    const totalQ = attempt.Quiz?.Questions?.length || 0;
    if (totalQ > 0) {
      totalScore += (attempt.score / totalQ) * 100;
      totalQuestions++;
    }
  });

  const avgScore = totalQuestions > 0 
    ? Math.round(totalScore / totalQuestions)
    : 0;

  const completedCourses = enrollments.filter(e => e.completed).length;
  const pendingCourses = enrollments.length - completedCourses;

  // Get scores per course
  const courseScores = {};
  for (const enrollment of enrollments) {
    const courseQuizzes = await Quiz.findAll({
      where: { CourseId: enrollment.CourseId },
      include: [{ model: Question }]
    });

    let courseTotalScore = 0;
    let courseTotalQuestions = 0;
    let courseAttempts = 0;

    for (const quiz of courseQuizzes) {
      const attempt = await Attempt.findOne({
        where: {
          UserId: userId,
          QuizId: quiz.id
        }
      });

      if (attempt) {
        const totalQ = quiz.Questions?.length || 0;
        if (totalQ > 0) {
          courseTotalScore += (attempt.score / totalQ) * 100;
          courseTotalQuestions++;
          courseAttempts++;
        }
      }
    }

    const courseAvgScore = courseAttempts > 0 
      ? Math.round(courseTotalScore / courseAttempts)
      : 0;

    courseScores[enrollment.CourseId] = {
      averageScore: courseAvgScore,
      totalQuizzes: courseQuizzes.length,
      attemptedQuizzes: courseAttempts
    };
  }

  res.json({
    enrolledCourses: enrollments.map(e => ({
      id: e.Course.id,
      title: e.Course.title,
      description: e.Course.description,
      progress: e.progress || 0,
      completed: e.completed || false,
      timeSpent: e.timeSpent || 0,
      averageScore: courseScores[e.CourseId]?.averageScore || 0,
      totalQuizzes: courseScores[e.CourseId]?.totalQuizzes || 0,
      attemptedQuizzes: courseScores[e.CourseId]?.attemptedQuizzes || 0
    })),
    completedCourses,
    pendingCourses,
    averageScore: avgScore
  });
});


module.exports = router;
