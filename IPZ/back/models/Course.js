const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Название курса
  category: { type: String, required: true }, // Категория: A/B/C
  price: { type: Number, required: true }, // Цена курса
  description: { type: String, required: false }, // Описание курса
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Course', CourseSchema);