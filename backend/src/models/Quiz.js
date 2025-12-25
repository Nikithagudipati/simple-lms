const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const Quiz = sequelize.define('Quiz', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Quiz;
