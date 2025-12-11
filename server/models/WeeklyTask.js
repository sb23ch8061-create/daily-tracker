const mongoose = require('mongoose');

const WeeklyTaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  day: { type: String, required: true }, // e.g., "Monday"
  time: { type: String, required: true }, // e.g., "09:00"
  duration: { type: Number, default: 60 },
  taskType: { type: String, default: 'General' },
  source: { type: String, default: 'Manual' } // 'Manual' or 'AI-Import'
}, { timestamps: true });

module.exports = mongoose.model('WeeklyTask', WeeklyTaskSchema);