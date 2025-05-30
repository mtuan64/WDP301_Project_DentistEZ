require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();

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

// Static files nếu cần (ví dụ nếu bạn có thư mục Uploads)
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Route mặc định
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Project API" });
});

// Routes
app.use("/api", require("./routes/authRoute"));

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
app.listen(PORT, () => {
  connectDB(); // kết nối DB khi server đã sẵn sàng
  console.log(`Server is running on port ${PORT}`);
});
