const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const Attempt = sequelize.define('Attempt', {
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Attempt;
