// models/Doctor.js
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clinic_id: {
    type: Number,
    required: true
  },
  Specialty: {
    type: String,
    required: true
  },
  Degree: {
    type: String,
    required: true
  },
  ExperienceYears: {
    type: Number,
    required: true
  },
  Description: {
    type: String
  },
  Status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  ProfileImage: {
    type: String
  }
});

module.exports = mongoose.model('Doctor', doctorSchema);
