const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const CourseMaterial = sequelize.define('CourseMaterial', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('pdf', 'video'),
    allowNull: false
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

module.exports = CourseMaterial;
