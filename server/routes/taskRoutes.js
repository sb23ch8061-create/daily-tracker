const { handleChat } = require('../controllers/chatController');
const express = require('express');
const router = express.Router();

// Import Controllers
const { 
  getTasks, 
  createTask, 
  getAnalytics, 
  updateTaskStatus, 
  deleteTask,
  updateTask // <--- Added this
} = require('../controllers/taskController');

const { parseTaskString } = require('../controllers/nlpController');
const { generateSchedule } = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

// Define Routes
router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.post('/nlp', protect, parseTaskString);
router.post('/auto-schedule', protect, generateSchedule);
router.post('/chat', protect, handleChat);
router.get('/analytics', protect, getAnalytics);

// Update Status (Toggle Checkbox)
router.put('/:id/status', protect, updateTaskStatus);

// Edit Details & Delete
router.route('/:id')
  .put(protect, updateTask)   
  .delete(protect, deleteTask);

module.exports = router;