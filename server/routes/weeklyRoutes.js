const express = require('express');
const router = express.Router();
const WeeklyTask = require('../models/WeeklyTask');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const { analyzeScheduleFile } = require('../controllers/aiController'); // <--- NEW AI IMPORT
// const xlsx = require('xlsx'); // NO LONGER NEEDED (AI handles parsing)

// Configure Multer (To handle file uploads in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- YOUR EXISTING CRUD ROUTES (Preserved) ---
// GET all weekly tasks
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await WeeklyTask.find({ user: req.user._id });
    res.json(tasks);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ADD a new weekly task
router.post('/', protect, async (req, res) => {
  try {
    const task = await WeeklyTask.create({ ...req.body, user: req.user._id });
    res.status(201).json(task);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

// DELETE a weekly task
router.delete('/:id', protect, async (req, res) => {
  try {
    await WeeklyTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- REAL FILE ANALYSIS ROUTE (Now using Gemini for multimodal parsing) ---
router.post('/analyze', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { buffer, mimetype } = req.file;
    
    // Call the high-end AI model
    const extractedTasks = await analyzeScheduleFile(buffer, mimetype, req.user._id);

    // AI returns JSON, ready for frontend review
    return res.json({ 
      message: 'AI Analysis Complete via Gemini', 
      tasks: extractedTasks 
    });

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    res.status(500).json({ message: "AI Analysis Failed: Check API Key and file format." });
  }
});

module.exports = router;