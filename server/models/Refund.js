// models/Refund.js
const mongoose = require("mongoose");

const RefundSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  refundAccount: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'refunded', 'failed'],
    default: 'pending'
  },
  reason: { type: String },
  processedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Refund", RefundSchema);
