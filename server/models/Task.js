const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'Scheduled', 'Completed'], default: 'Pending' },
  deadline: { type: Date },
  duration: { type: Number, required: true }, // in minutes
  category: { type: String, default: 'General' },
  startTime: { type: Date }, // Calculated by AI
  endTime: { type: Date },   // Calculated by AI
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);