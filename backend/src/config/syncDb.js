const { sequelize } = require('../models');

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully');
    process.exit();
  } catch (err) {
    console.error('❌ DB sync failed:', err);
    process.exit(1);
  }
})();
