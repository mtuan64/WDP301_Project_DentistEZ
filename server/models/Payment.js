const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    amount: Number,
    description: String,
    orderCode: String,
    status: {
      type: String,
      enum: ["pending", "paid", "canceled"],
      default: "pending",
    },
    payUrl: String,
    qrCode: String,
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" }, // nếu liên kết lịch hẹn
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
