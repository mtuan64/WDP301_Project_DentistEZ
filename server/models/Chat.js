const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  roomId: { type: String, required: true },
});

module.exports = mongoose.model("Chat", chatSchema);
