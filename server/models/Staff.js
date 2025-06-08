const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const staffSchema = new Schema(
  {
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
    Status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  },
  { timestamps: true }
);

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;