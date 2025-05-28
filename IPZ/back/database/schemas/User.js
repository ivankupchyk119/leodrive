const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: mongoose.SchemaTypes.String,
    required: true,
    unique: true,
  },
  name: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  surname: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  password: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  role: {
    type: mongoose.SchemaTypes.String,
    enum: ['student', 'instructor', 'admin'],
    required: true,
  },
  createdAt: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now,
  },
  ratings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rating',
    },
  ],
  schedule: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
    },
  ],
});

module.exports = mongoose.model('User', UserSchema);
