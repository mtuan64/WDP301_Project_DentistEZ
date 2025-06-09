// models/Doctor.js
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  Status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
});

module.exports = mongoose.model('Staff', staffSchema);
