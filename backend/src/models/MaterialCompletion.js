const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const MaterialCompletion = sequelize.define('MaterialCompletion', {
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  CourseMaterialId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = MaterialCompletion;
