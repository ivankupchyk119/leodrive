const mongoose = require('mongoose');

// Определение схемы для результатов тестов
const testResultSchema = new mongoose.Schema({
  category: { 
    type: String, 
    required: true 
  }, // Категория теста

  result: { 
    type: Number, 
    required: true 
  },   // Процент правильных ответов

  user: {
    type: mongoose.Schema.Types.ObjectId, // Ссылка на пользователя
    ref: 'User', // Модель пользователя
    required: true
  }, // Привязка к пользователю, который прошел тест

  createdAt: {
    type: mongoose.Schema.Types.Date,
    default: Date.now,
  }
});

// Модель для работы с коллекцией "testresults"
module.exports = mongoose.model('TestResult', testResultSchema);