const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Інструктор
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  type: { type: String, enum:  ['wyklad', 'praktyka', 'egzamin_t','egzamin_p', 'latwo'] , required: true, default: 'praktyka' }, // Додаємо `lecture`
  studentNotes: { type: String, default: '',required:false },//це щойно додав, потрібно написати команду в базу щоб можна було це поле додати
  assessment: { type: Number, required:false },//це щойно додав, потрібно написати команду в базу щоб можна було це поле додати
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  course: { type: String, required: false }, // Курс (залишаємо без змін)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
