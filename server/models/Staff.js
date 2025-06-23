
const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    Status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    


},{timestamps: true});
module.exports = mongoose.model('Staff', StaffSchema);

