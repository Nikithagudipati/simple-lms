const bcrypt = require('bcrypt');
const { sequelize, User } = require('../models');

(async () => {
  try {
    await sequelize.sync();

    const users = [
      {
        name: 'Admin User',
        email: 'admin@lms.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      },
      {
        name: 'Instructor User',
        email: 'instructor@lms.com',
        password: await bcrypt.hash('instr123', 10),
        role: 'instructor'
      },
      {
        name: 'Student User',
        email: 'student@lms.com',
        password: await bcrypt.hash('stud123', 10),
        role: 'student'
      }
    ];

    for (const u of users) {
      await User.findOrCreate({
        where: { email: u.email },
        defaults: u
      });
    }

    console.log('✅ Users seeded successfully');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
})();
