const mongoose = require('mongoose');

// This stores "exceptions" to the rule.
// E.g., "Skip the Weekly Task with ID '123' on date '2025-12-08'"
const WeeklyExceptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weeklyTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyTask', required: true },
  originalDate: { type: String, required: true }, // Format: "YYYY-MM-DD"
  type: { type: String, enum: ['cancelled', 'rescheduled'], default: 'cancelled' }
}, { timestamps: true });

module.exports = mongoose.model('WeeklyException', WeeklyExceptionSchema);