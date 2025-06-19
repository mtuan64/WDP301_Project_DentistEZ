const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chat/chatbotController");
const chatboxController = require("../controllers/chat/chatboxController");

router.post("/chatwithai", chatbotController.chatWithAI);
router.get("/messages", chatboxController.getMessages);
router.post("/send", chatboxController.sendMessage);

module.exports = router;
