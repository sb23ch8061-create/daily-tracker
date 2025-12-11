const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const weeklyRoutes = require('./routes/weeklyRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes'); // <--- New Schedule Logic
const feedbackRoutes = require('./routes/feedbackRoutes');

// Config
dotenv.config();

// --- CRITICAL FIX: Initialize 'app' BEFORE using it ---
const app = express(); 

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('common'));

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected Successfully');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

// Routes
// (These must come AFTER 'const app = express()')
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/weekly', weeklyRoutes);
app.use('/api/schedule', scheduleRoutes); // <--- This activates your new Schedule features
app.use('/api/feedback', feedbackRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});