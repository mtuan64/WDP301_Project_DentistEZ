// models/Doctor.js
const mongoose = require("mongoose");


const doctorSchema = new mongoose.Schema({

  userId: {type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true},
  clinic_id: {type:mongoose.Schema.Types.ObjectId,ref: 'Clinic',required: true},

  Specialty: {
    type: String,
  },
  Degree: {
    type: String,
  },
  ExperienceYears: {
    type: Number,
  },
  Description: {
    type: String,
  },
  Status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  ProfileImage: {
    type: String,
  },
});

module.exports = mongoose.model("Doctor", doctorSchema);
