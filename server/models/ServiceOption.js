const mongoose = require("mongoose");

const serviceOption = new mongoose.Schema({
    serviceId :{type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true},
    optionName: { type: String, required: true },
    price: { type: Number, required: true },
    image : {type : String, required: true},

},{timestamps: true});
module.exports = mongoose.model('ServiceOption', serviceOption);
