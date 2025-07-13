const express = require("express");
const router = express.Router();

const { authPatientMiddleware } = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");
const patientAppController = require("../controllers/appointment/patientAppController");

// Thư viện cho upload file
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");


// Multer để nhận file vào memory
const upload = multer({ storage: multer.memoryStorage() });

// API upload file lên Cloudinary
router.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Không có file." });

    // Upload bằng stream
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "appointment_files",
            resource_type: "auto"
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);

    res.status(201).json({
      message: "Upload file thành công.",
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi upload file.", error: error.message });
  }
});

// API tạo payment (cọc) - cần xác thực bệnh nhân
router.post("/create-payment", authPatientMiddleware, paymentController.createPayment);

// API callback PayOS (webhook) - không cần xác thực
router.post("/payos-callback", patientAppController.payosCallback);

module.exports = router;
