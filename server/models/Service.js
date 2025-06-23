const mongoose = require("mongoose");


const serviceSchema = new mongoose.Schema({
     doctorId :{type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true},
     clinicId :{type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: [true, 'Clinic ID is required']},
     serviceName: { type: String, required: true },
     description: { type: String, required: true },
     image : { type: String},

},{timestamps: true});
module.exports = mongoose.model('Service', serviceSchema);
    