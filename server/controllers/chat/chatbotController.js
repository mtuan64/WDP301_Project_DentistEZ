require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const conversationHistory = {}; // In-memory conversation history

const chatbotController = {
  chatWithAI: async (req, res) => {
    try {
      const { message, sessionId } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Initialize conversation history for the session if it doesn't exist
      if (!conversationHistory[sessionId]) {
        conversationHistory[sessionId] = [];
      }

      conversationHistory[sessionId].push({ role: "user", content: message });

      const combinedMessages = conversationHistory[sessionId]
        .map((entry) => `${entry.role}: ${entry.content}`)
        .join("\n");

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(combinedMessages);
      const response = await result.response;
      const aiReply = response.text();

      conversationHistory[sessionId].push({
        role: "assistant",
        content: aiReply,
      });

      res.json({ reply: aiReply });
    } catch (error) {
      console.error(
        "Error in chatWithAI:",
        error.response?.data || error.message
      );
      res.status(500).json({
        error: "Failed to generate AI reply",
        details: error.response?.data || error.message,
      });
    }
  },
};

module.exports = chatbotController;
