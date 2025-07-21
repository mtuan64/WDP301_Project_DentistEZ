// models/Otp.js
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: {
    type: String,
    enum: ["forgot-password", "verify-email"],
    required: true,
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 3 * 60 * 1000),
    expires: 300,
  },
});

const Otp = mongoose.model("Otp", otpSchema, "otp");

module.exports = Otp;
