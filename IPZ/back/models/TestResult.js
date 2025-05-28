const mongoose = require('mongoose');

// Опис схеми для результатів тестів
const testResultSchema = new mongoose.Schema({
  category: { type: String, required: true }, // Категорія тесту
  result: { type: Number, required: true },   // Процент правильних відповідей
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  testName: { type: String, required: true },
});

// Створення моделі для роботи з колекцією "testresults"
testResultSchema.index({ student: 1, category: 1, testName: 1 }, { unique: true });

module.exports = mongoose.model('TestResult', testResultSchema);
