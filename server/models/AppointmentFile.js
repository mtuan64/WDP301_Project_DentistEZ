const mongoose = require("mongoose");

const appointmentFileSchema = new mongoose.Schema({
  appointmentId: {type: mongoose.Schema.Types.ObjectId,ref: "Appointment",required: true},
  fileName: {type: String},
  fileUrl: {type: String,},
  fileType: {type: String,enum: ['pdf', 'jpg', 'png', 'docx', 'xlsx', 'other']},
  description: {type: String}
}, { timestamps: true });

module.exports = mongoose.model('AppointmentFile', appointmentFileSchema);
