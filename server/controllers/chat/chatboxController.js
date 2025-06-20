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
    console.log("New client connected:", socket.id);

    socket.on("joinRoom", async ({ userId, role }) => {
      try {
        console.log("Joining room with userId:", userId, "role:", role);
        if (!userId || !mongoose.isValidObjectId(userId)) {
          console.error("Join room error: Invalid userId", userId);
          return socket.emit("error", { message: "Invalid user ID" });
        }
        if (role === "patient") {
          const roomId = `chat-${userId}`;
          socket.join(roomId);
          socket.roomId = roomId;
          console.log(`Patient ${userId} joined room ${roomId}`);
        } else if (role === "staff") {
          const patientsWithMessages = await Chat.find().distinct("senderId");
          const patients = await User.find({
            _id: { $in: patientsWithMessages },
            role: "patient",
          }).select("_id fullname");
          patients.forEach((patient) => {
            const roomId = `chat-${patient._id}`;
            socket.join(roomId);
            activePatients.add(patient._id.toString());
            console.log(
              `Staff ${userId} joined room ${roomId} for patient ${patient.fullname}`
            );
          });
          io.to(socket.id).emit("updatePatients", patients);
        }
      } catch (error) {
        console.error("Join room error:", error.message);
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

          let roomId;
          let targetReceiverId =
            receiverId && mongoose.isValidObjectId(receiverId)
              ? receiverId
              : null;

          if (role === "patient") {
            roomId = `chat-${senderId}`;
            const newMessage = new Chat({
              senderId,
              receiverId: null, // Không xác định staff cụ thể
              message,
              roomId,
            });
            await newMessage.save();

            activePatients.add(senderId.toString());
            const patients = await User.find({
              _id: { $in: Array.from(activePatients) },
              role: "patient",
            }).select("_id fullname");

            io.emit("updatePatients", patients);

            // Gửi tin nhắn cho staff, không gửi lại cho patient
            socket.to(roomId).emit("receiveMessage", {
              senderId,
              senderName,
              message,
              roomId,
              receiverId: null,
              timestamp: new Date(),
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
            });
            await newMessage.save();

            // Gửi tin nhắn cho patient, không gửi lại cho staff
            socket.to(roomId).emit("receiveMessage", {
              senderId,
              senderName,
              message,
              roomId,
              receiverId: targetReceiverId,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          console.error("Send message error:", error.message);
          socket.emit("error", {
            message: "Error sending message",
            error: error.message,
          });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
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
      .populate("senderId", "username fullname")
      .populate("receiverId", "username fullname");
    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error.message);
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
      });
      await newMessage.save();
      console.log(`Message saved for patient ${senderId} via HTTP: ${message}`);

      activePatients.add(senderId.toString());
      const patients = await User.find({
        _id: { $in: Array.from(activePatients) },
        role: "patient",
      }).select("_id fullname");
      io.emit("updatePatients", patients);

      io.to(roomId).emit("receiveMessage", {
        senderId,
        senderName,
        message,
        roomId,
        receiverId: targetReceiverId,
        timestamp: new Date(),
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
      });
      await newMessage.save();
      console.log(`Message saved for staff ${senderId} via HTTP: ${message}`);

      io.to(roomId).emit("receiveMessage", {
        senderId,
        senderName,
        message,
        roomId,
        receiverId: targetReceiverId,
        timestamp: new Date(),
      });

      res
        .status(200)
        .json({ message: "Message sent successfully", data: newMessage });
    }
  } catch (error) {
    console.error("Send message HTTP error:", error.message);
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
};
