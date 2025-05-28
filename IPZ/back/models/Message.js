const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // <- Добавили
  room: { type: String },
  content: { type: String, required: true },
  name: String,
  surname: String,
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
