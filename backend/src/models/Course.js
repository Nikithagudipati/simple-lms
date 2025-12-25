// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/db');

// const Course = sequelize.define('Course', {
//   title: DataTypes.STRING,
//   description: DataTypes.TEXT,
//   level: DataTypes.STRING
// });

// module.exports = Course;

const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const Course = sequelize.define('Course', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft'
  },
  instructorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Course;


