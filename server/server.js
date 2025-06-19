require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const chatboxController = require("./controllers/chat/chatboxController");

const app = express();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình CORS
const corsOptions = {
  origin: ["http://localhost:5173"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Route mặc định
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Project API" });
});

// Routes
app.use("/api", require("./routes/authRoute"));
app.use("/api/chat", require("./routes/chatRoute"));

// 404 handler
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// Start server
const PORT = process.env.PORT || 9999;
const server = app.listen(PORT, () => {
  connectDB(); // kết nối DB khi server đã sẵn sàng
  console.log(`Server is running on port ${PORT}`);
  chatboxController.initializeSocket(server);
});
