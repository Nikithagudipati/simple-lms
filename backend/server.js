
require('dotenv').config();
console.log('JWT SECRET:', process.env.JWT_SECRET);


const app = require('./src/app');
const db = require('./src/models');

const PORT = process.env.PORT || 5000;
db.sequelize.sync({ alter: true }).then(() => {
  console.log('📦 Database synced');
});



app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
});
