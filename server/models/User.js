const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: { type: String},
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'staff', 'admin'], default: 'patient' },
    phone: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date},
    gender: { type: String, enum: ['male', 'female', 'other',''], default:'' },
    profilePicture: { type: String }, 
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);
module.exports = User;