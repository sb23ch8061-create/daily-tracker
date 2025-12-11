const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true }, 
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'Pending' },
  
  deadline: { type: Date, default: null },
  duration: { type: Number, default: 30 },
  interest: { type: Number, default: 3 },
  taskType: { type: String, default: 'General' }, 
  suitableTime: { type: String, default: 'Any' },

  // --- NEW FIELD FOR CUSTOM COLUMNS ---
  // This stores data like: { "My Date": "2025-01-01", "Notes": "Hello" }
  customValues: { 
    type: Map,
    of: String,
    default: {}
  },

  startTime: { type: Date },
  endTime: { type: Date },
}, { timestamps: true });

// Virtual for Days Left
TaskSchema.virtual('daysLeft').get(function() {
  if (!this.deadline) return '-';
  const today = new Date();
  const diffTime = new Date(this.deadline) - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

TaskSchema.set('toJSON', { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', TaskSchema);