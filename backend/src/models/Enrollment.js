const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const Enrollment = sequelize.define('Enrollment', {
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  timeSpent: {
    type: DataTypes.INTEGER, // Time in minutes
    defaultValue: 0
  }
});

module.exports = Enrollment;
