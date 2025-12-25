const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const Question = sequelize.define('Question', {
  question: {
    type: DataTypes.STRING,
    allowNull: false
  },

  options: {
    type: DataTypes.TEXT,          // STORED AS STRING IN DB
    allowNull: false,
    validate: {
      notEmpty: true
    },
    get() {
      const raw = this.getDataValue('options');
      return raw ? JSON.parse(raw) : [];
    },
    set(value) {
      this.setDataValue('options', JSON.stringify(value));
    }
  },

  correctAnswer: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Question;
