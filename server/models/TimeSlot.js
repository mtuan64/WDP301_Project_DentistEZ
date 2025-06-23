const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  slot_index: { type: Number, required: true }, // 1,2,3,4,5,6
  start_time: { type: String, required: true }, // "08:00"
  end_time: { type: String, required: true },   // "09:00"
  isAvailable: { type: Boolean, default: true },
  note : { type: String },
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' }
}, { timestamps: true });

// Index để tránh duplicate
TimeSlotSchema.index({ doctorId: 1, date: 1, slot_index: 1 }, { unique: true });

module.exports = mongoose.model('TimeSlot', TimeSlotSchema);
