const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, min: 0, max: 10, required: true },
  comment: { type: String, default: '' },
  course: { type: mongoose.Schema.Types.ObjectId, required: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Rating', RatingSchema);
