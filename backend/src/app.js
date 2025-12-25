console.log('🔥 app.js loaded');

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// root health check
app.get('/', (req, res) => {
  res.send('LMS Backend is running');
});

// API routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/instructor', require('./routes/instructor.routes'));
app.use('/api/student', require('./routes/student.routes'));
app.use('/api/courses', require('./routes/course.routes'));


module.exports = app;
