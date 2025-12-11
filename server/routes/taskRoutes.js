const express = require('express');
const router = express.Router();

// --- 1. PRESERVED IMPORTS (Chat & Auth) ---
const { handleChat } = require('../controllers/chatController'); 
const { protect } = require('../middleware/authMiddleware');

// --- 2. IMPORT EVERYTHING FROM taskController ---
// (We use the new 'autoSchedule' and 'nlpTask' from here because we just fixed them)
const { 
  getTasks, 
  createTask, 
  getAnalytics, 
  updateTaskStatus, 
  deleteTask,
  updateTask,
  nlpTask,        // <--- Replaces old nlpController
  autoSchedule    // <--- Replaces old scheduleController (Contains the Delay Fix)
} = require('../controllers/taskController');

// --- 3. DEFINE ROUTES ---

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

// Use the NEW fixed logic in taskController
router.post('/nlp', protect, nlpTask);
router.post('/auto-schedule', protect, autoSchedule);

// Keep your existing Chat feature
router.post('/chat', protect, handleChat);

router.get('/analytics', protect, getAnalytics);

// Update Status (Toggle Checkbox)
router.put('/:id/status', protect, updateTaskStatus);

// Edit Details & Delete
router.route('/:id')
  .put(protect, updateTask)   
  .delete(protect, deleteTask);

module.exports = router;