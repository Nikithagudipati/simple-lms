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
  }
});

module.exports = Enrollment;
