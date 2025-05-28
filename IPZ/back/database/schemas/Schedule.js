const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: String, // Название курса или код курса
    required: false,
  },
  category: {
    type: String, // Категория: A/B/C
    required: false,
  },
  date: {
    type: mongoose.SchemaTypes.Date,
    required: true,
  },
  startTime: {
    type: mongoose.SchemaTypes.String, // Например, "10:00"
    required: true,
  },
  endTime: {
    type: mongoose.SchemaTypes.String, // Например, "11:30"
    required: true,
  },
  status: {
    type: mongoose.SchemaTypes.String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
