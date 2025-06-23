
const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    Status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }

},{timestamps: true, collection: 'patients' });

module.exports = mongoose.model('Patient', PatientSchema);

