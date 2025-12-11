const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Issue', 'Bug', 'Suggestion'], default: 'Suggestion' },
  message: { type: String, required: true },
  imageUrl: { type: String } // In a real app, you'd store the URL from S3/Cloudinary
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);