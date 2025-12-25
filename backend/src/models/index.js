const sequelize = require('../config/db');

const User = require('./User');
const Course = require('./Course');
const CourseMaterial = require('./CourseMaterial');
const Quiz = require('./Quiz');
const Question = require('./Question');
const Enrollment = require('./Enrollment');
const Attempt = require('./Attempt');



// Instructor → Courses
User.hasMany(Course, { foreignKey: 'instructorId' });
Course.belongsTo(User, { as: 'Instructor', foreignKey: 'instructorId' });

// Course → Materials
Course.hasMany(CourseMaterial);
CourseMaterial.belongsTo(Course);

// Course → Quiz
Course.hasMany(Quiz);
Quiz.belongsTo(Course);

// Quiz → Questions
Quiz.hasMany(Question);
Question.belongsTo(Quiz);

// Students ↔ Courses (Enrollment)
User.belongsToMany(Course, { through: Enrollment });
Course.belongsToMany(User, { through: Enrollment });


Enrollment.belongsTo(User);
Enrollment.belongsTo(Course);

// Quiz Attempts
User.hasMany(Attempt);
Quiz.hasMany(Attempt);
Attempt.belongsTo(User);
Attempt.belongsTo(Quiz);

module.exports = {
  sequelize,
  User,
  Course,
  CourseMaterial,
  Quiz,
  Question,
  Enrollment,
  Attempt
};
