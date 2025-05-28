const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], required: true },
  createdAt: { type: Date, default: Date.now },
  ratings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rating' }],
  schedule: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }],
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: false }, // Посилання на курс
  avatarUrl:{ type: String },
  total: { type: Number, required: true, default: 0 }, // сколько должен заплатить
  paid: { type: Number, default: 0 }, // сколько заплатил
  premium: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', UserSchema);