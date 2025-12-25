require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();

    const hash = await bcrypt.hash('inst123', 10);

    await User.update(
      { password: hash },
      { where: { email: 'instructor@lms.com' } }
    );

    console.log('✅ Instructor password reset to inst123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
