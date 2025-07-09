
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    patientId :{type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true},
    doctorId :{type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true},
    staffId :{type: mongoose.Schema.Types.ObjectId, ref: "Staff"},
    serviceId :{type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true},
    serviceOptionId :{type: mongoose.Schema.Types.ObjectId, ref: "ServiceOption", required: true},
    clinicId :{type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: [true, 'Clinic ID is required']},
    timeslotId :{type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true},
    note : { type: String },
    status: {
    type: String,
    enum: ["confirmed", "cancelled","completed","fully_paid"], 
    default: "confirmed"
  },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
      }

    

},{timestamps: true});
module.exports = mongoose.model('Appointment', appointmentSchema);
