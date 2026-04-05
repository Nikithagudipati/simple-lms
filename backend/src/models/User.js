const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING },
  password: DataTypes.STRING,
  role: DataTypes.ENUM('admin', 'instructor', 'student')
});

module.exports = User;