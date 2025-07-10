// models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  PatientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  DoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  StaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  serviceid: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  clinic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  
  AppointmentDate: { type: Date, required: true },
  AppointmentTime: { type: String, required: true }, // bạn có thể thay bằng Date nếu lưu timestamp đầy đủ

  Note: { type: String },

}, {
  timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
