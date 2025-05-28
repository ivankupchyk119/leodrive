const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ratedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Кто поставил оценку (например, администратор или ученик)
    required: true,
  },
  score: {
    type: mongoose.SchemaTypes.Number,
    min: 0,
    max: 10, // Шкала оценок от 0 до 10
    required: true,
  },
  comment: {
    type: mongoose.SchemaTypes.String,
    default: '',
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', // Рейтинг связан с конкретным курсом
    required: false,
  },
  createdAt: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Rating', RatingSchema);
