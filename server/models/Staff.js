// models/Staff.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const staffSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  Status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
});

module.exports = mongoose.model('Staff', staffSchema);
