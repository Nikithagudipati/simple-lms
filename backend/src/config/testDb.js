const sequelize = require('./db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');
    process.exit();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
})();
