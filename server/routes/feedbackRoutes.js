const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/authMiddleware');

// Submit Feedback
router.post('/', protect, async (req, res) => {
  try {
    const { type, message, imageUrl } = req.body;
    const feedback = await Feedback.create({
      user: req.user._id,
      type,
      message,
      imageUrl
    });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;