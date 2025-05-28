const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  title:       { type: String,  required: true },
  description: { type: String },
  filePath:    { type: String,  required: false },
  link:        { type: String, required: false },   // локальный путь или URL
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: false},
  instructor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  uploadedAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Material', MaterialSchema);
