const mongoose = require('mongoose');

const ClinicSchema = new mongoose.Schema({
    clinic_name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    }
},{collection: 'clinics'});

module.exports = mongoose.model('Clinic', ClinicSchema);