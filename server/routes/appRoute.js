const express = require("express");
const router = express.Router();

const { authPatientMiddleware, authStaffMiddleware, authPatientOrStaffMiddleware } = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");
const patientAppController = require("../controllers/appointment/patientAppController");
const repatientAppController = require("../controllers/appointment/repatientAppController");
const timeslotController = require("../controllers/timeslotController");
const { getAllAppointmentByStaff } = require("../controllers/appointment/staffAppController");
const { createFinalOnlinePayment, createFinalCashPayment, payosCallbackFinal, getAppointmentDetail, getDepositTotal } = require("../controllers/paymetfinal/finalPaymentController");

// Thư viện cho upload file
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { getAllAppointment, getAppointmentsByPatient, cancelAppointmentWithRefund, getAllRefunds, confirmRefund, cancelAppointment } = require("../controllers/appointmentController");


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
console.log('appRoute.js loaded');

// API tạo payment (cọc) - cần xác thực bệnh nhân
router.post("/create-payment", authPatientMiddleware, paymentController.createPayment);

router.post("/webhook/payos", paymentController.handlePaymentWebhook);
// API callback PayOS (webhook) - không cần xác thực
router.post("/payos-callback", patientAppController.payosCallback);

//appointment routes
router.get("/patient/:userId", getAppointmentsByPatient);
router.get("/refunds", getAllRefunds);
router.put("/cancel-refund/:id", authPatientMiddleware, cancelAppointmentWithRefund);
router.put("/refunds/confirm/:id", confirmRefund);
router.put("/cancel/:id", authPatientMiddleware, cancelAppointment);
// api lịch tái khám 
router.post('/re-examination/:id',authPatientOrStaffMiddleware ,repatientAppController.createReExamination);
router.get("/timeslots/by-doctor/:doctorId",authPatientOrStaffMiddleware,timeslotController.getSlotByDoctorId);
router.get("/re-examinations/:id",authPatientMiddleware,repatientAppController.getReExaminationsByRoot);

// staff appointment management
router.get("/staff/appointments", authStaffMiddleware, getAllAppointmentByStaff);

// thanh toán 70% cho lịch hẹn
router.post("/payments/:appointmentId/final/online", createFinalOnlinePayment); 
router.post("/payments/:appointmentId/final/cash", createFinalCashPayment);     
router.get("/payments/deposit-total/:appointmentId", getDepositTotal); 
router.get("/staffmodal/appointments/:id", getAppointmentDetail);
module.exports = router;
