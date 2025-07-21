const mongoose = require("mongoose");


const PaymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    orderCode: {
      type: Number,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ["pending", "paid", "canceled"],
      default: "pending"
    },
    type: {
      type: String,
      enum: ["deposit", "final"], // deposit: thanh toan truoc, final: thanh toan sau
      default: "deposit"
    },
    paymentMethod: {
      type: String,
      enum: ["online", "cash"],
      default: "online"
    },

    payUrl: {
      type: String
    },
    qrCode: {
      type: String
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null
    },
    metaData: {
      patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      serviceOptionId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceOption" },
      clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },
      timeslotId: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot" },
      note: { type: String },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      fileUrl: { type: String },
      fileName: { type: String },
      fileType: { type: String },
      reExaminationOf: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
