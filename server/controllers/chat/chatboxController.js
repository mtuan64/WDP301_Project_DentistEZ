const Chat = require("../../models/Chat");
const User = require("../../models/User");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

let io;
const activePatients = new Set();

module.exports.initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", async ({ userId, role }) => {
      try {
        if (!userId || !mongoose.isValidObjectId(userId)) {
          return socket.emit("error", { message: "Invalid user ID" });
        }
        if (role === "patient") {
          const roomId = `chat-${userId}`;
          socket.join(roomId);
          socket.roomId = roomId;
          await Chat.updateMany(
            { roomId, receiverId: userId, isRead: false },
            { $set: { isRead: true } }
          );
          io.to(roomId).emit("messagesRead", { roomId });
        } else if (role === "staff") {
          const patientsWithMessages = await Chat.find().distinct("senderId");
          const patients = await User.find({
            _id: { $in: patientsWithMessages },
            role: "patient",
          }).select("_id fullname profilePicture");
          patients.forEach((patient) => {
            const roomId = `chat-${patient._id}`;
            socket.join(roomId);
            activePatients.add(patient._id.toString());
          });
          io.to(socket.id).emit("updatePatients", patients);
        }
      } catch (error) {
        // console.error("Join room error:", error.message);
        socket.emit("error", {
          message: "Error joining room",
          error: error.message,
        });
      }
    });

    socket.on(
      "sendMessage",
      async ({ senderId, senderName, role, message, receiverId }) => {
        try {
          if (!senderId || !mongoose.isValidObjectId(senderId)) {
            return socket.emit("error", { message: "Invalid sender ID" });
          }
          if (!message || !role) {
            return socket.emit("error", { message: "Missing fields" });
          }

          // Lấy thông tin người gửi để lấy profilePicture
          const sender = await User.findById(senderId).select("profilePicture");
          if (!sender) {
            return socket.emit("error", { message: "Sender not found" });
          }

          let roomId;
          let targetReceiverId =
            receiverId && mongoose.isValidObjectId(receiverId)
              ? receiverId
              : null;

          if (role === "patient") {
            roomId = `chat-${senderId}`;
            const newMessage = new Chat({
              senderId,
              receiverId: null,
              message,
              roomId,
              isRead: false,
            });
            await newMessage.save();

            activePatients.add(senderId.toString());
            const patients = await User.find({
              _id: { $in: Array.from(activePatients) },
              role: "patient",
            }).select("_id fullname profilePicture");

            io.emit("updatePatients", patients);

            socket.to(roomId).emit("receiveMessage", {
              senderId,
              senderName,
              message,
              roomId,
              receiverId: null,
              timestamp: new Date(),
              isRead: false,
              profilePicture: sender.profilePicture || "👤",
            });
          } else if (role === "staff") {
            if (!receiverId || !mongoose.isValidObjectId(receiverId)) {
              return socket.emit("error", { message: "Invalid receiver ID" });
            }

            roomId = `chat-${receiverId}`;
            const newMessage = new Chat({
              senderId,
              receiverId: targetReceiverId,
              message,
              roomId,
              isRead: false,
            });
            await newMessage.save();

            socket.to(roomId).emit("receiveMessage", {
              senderId,
              senderName,
              message,
              roomId,
              receiverId: targetReceiverId,
              timestamp: new Date(),
              isRead: false,
              profilePicture: sender.profilePicture || "👤",
            });
          }
        } catch (error) {
          // console.error("Send message error:", error.message);
          socket.emit("error", {
            message: "Error sending message",
            error: error.message,
          });
        }
      }
    );

    socket.on("markMessagesAsRead", async ({ roomId, userId, role }) => {
      try {
        if (!roomId || !userId || !mongoose.isValidObjectId(userId)) {
          return socket.emit("error", { message: "Invalid roomId or userId" });
        }
        if (role === "patient") {
          await Chat.updateMany(
            { roomId, receiverId: userId, isRead: false },
            { $set: { isRead: true } }
          );
        } else if (role === "staff") {
          const patientId = roomId.replace("chat-", "");
          await Chat.updateMany(
            { roomId, senderId: patientId, isRead: false },
            { $set: { isRead: true } }
          );
        }
        io.to(roomId).emit("messagesRead", { roomId });
      } catch (error) {
        // console.error("Mark messages as read error:", error.message);
        socket.emit("error", {
          message: "Error marking messages as read",
          error: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      // console.log("Client disconnected:", socket.id);
    });
  });
};

module.exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Valid userId is required" });
    }
    const roomId = `chat-${userId}`;
    const messages = await Chat.find({ roomId })
      .populate("senderId", "username fullname profilePicture")
      .populate("receiverId", "username fullname profilePicture");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(messages);

  } catch (error) {
    // console.error("Get messages error:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching messages", error: error.message });
  }
};

module.exports.sendMessage = async (req, res) => {
  try {
    const { senderId, senderName, role, message, receiverId } = req.body;
    if (!senderId || !mongoose.isValidObjectId(senderId) || !message || !role) {
      return res
        .status(400)
        .json({ message: "Invalid senderId or missing required fields" });
    }

    const sender = await User.findById(senderId).select("profilePicture");
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    let roomId;
    let targetReceiverId =
      receiverId && mongoose.isValidObjectId(receiverId) ? receiverId : null;

    if (role === "patient") {
      roomId = `chat-${senderId}`;
      const newMessage = new Chat({
        senderId,
        receiverId: targetReceiverId,
        message,
        roomId,
        isRead: false,
      });
      await newMessage.save();

      activePatients.add(senderId.toString());
      const patients = await User.find({
        _id: { $in: Array.from(activePatients) },
        role: "patient",
      }).select("_id fullname profilePicture");
      io.emit("updatePatients", patients);

      io.to(roomId).emit("receiveMessage", {
        senderId,
        senderName,
        message,
        roomId,
        receiverId: targetReceiverId,
        timestamp: new Date(),
        isRead: false,
        profilePicture: sender.profilePicture || "👤",
      });

      res
        .status(200)
        .json({ message: "Message sent successfully", data: newMessage });
    } else if (role === "staff") {
      if (!receiverId || !mongoose.isValidObjectId(receiverId)) {
        return res
          .status(400)
          .json({ message: "Valid receiver ID required for staff" });
      }
      roomId = `chat-${receiverId}`;
      const newMessage = new Chat({
        senderId,
        receiverId: targetReceiverId,
        message,
        roomId,
        isRead: false,
      });
      await newMessage.save();

      io.to(roomId).emit("receiveMessage", {
        senderId,
        senderName,
        message,
        roomId,
        receiverId: targetReceiverId,
        timestamp: new Date(),
        isRead: false,
        profilePicture: sender.profilePicture || "👤",
      });

      res
        .status(200)
        .json({ message: "Message sent successfully", data: newMessage });
    }
  } catch (error) {
    // console.error("Send message HTTP error:", error.message);
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
};
