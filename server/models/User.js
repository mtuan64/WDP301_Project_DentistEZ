const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      validate: {
        validator: function (v) {
          if (this.isGoogleAccount) return true;

          return v != null && v.length > 0;
        },
        message: "Password is required.",
      },
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "staff", "admin"],
      default: "patient",
    },
    phone: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    profilePicture: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
