// controllers/authController.js
const User = require("../models/User");
const Otp = require("../models/Otp");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/emailService");
const bcrypt = require("bcryptjs");

const generateOTP = () => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  return otp;
};

const sendOTPEmail = async (email, otp) => {
  const subject = "Password Reset OTP";
  const text = `Your OTP for password reset is ${otp}. It will expire in 3 minutes.`;
  await sendEmail(email, subject, text);
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpRecord = new Otp({
      email,
      otp,
      purpose: "forgot-password",
    });
    await otpRecord.save();

    await sendOTPEmail(email, otp);

    res
      .status(200)
      .json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "forgot-password",
    });
    if (!otpRecord || otpRecord.expireAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const token = jwt.sign({ userId: otpRecord._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "OTP verified", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);
    
    const otpRecord = await Otp.findById(decoded.userId);
    if (!otpRecord) {
      return res.status(404).json({ message: "OTP record not found" });
    }

    const user = await User.findOne({ email: otpRecord.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Remove the OTP record after successful password reset
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
};
