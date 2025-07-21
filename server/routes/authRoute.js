const express = require("express");
const router = express.Router();

const { authMiddleware, authAdminMiddleware, authDentistMiddleware, authPatientMiddleware , authDentistOrAdminMiddleware } = require("../middleware/authMiddleware");
const {registerUser,loginUser,uploadProfilePicture,updateUser,upload, getServiceDetail,logoutUser,googleLogin} = require("../controllers/authController");
const {getAllDoctors,getDoctorById,updateDoctorStatus, createSchedule, getSchedule, getScheduleByWeek, getSchedulebydoctorId, updateDoctor} = require("../controllers/doctorController");
const {getAllBlogs,getAllBlogsForAdmin,createBlog,updateBlog,deleteBlog,uploadImage,getAllCategories,getAllCategoriesForAdmin, createCategory,updateCategory,deleteCategory,getBlogBySlug,getTopViewedBlogs,incrementBlogViews} = require("../controllers/blogController");
const {
  getAllAppointment,
  getAppointmentByUserId,
  editAppointment,
  deleteAppointment,
  getAppointmentByTimeslot,
  updateAppointmentStatusAndNote,
} = require("../controllers/appointmentController");
const {
  getUserProfile,
  updateUserProfile,
  uploadPictureProfile,
  changePassword,
} = require("../controllers/userController");

const {
  getAppointmentTrend,
  getRevenueTrend,
  getAppointmentStatusStats,
  getRevenueByMethod,
  getRevenueByType,
  getDashboardSummaries,
  getAppointmentByClinic,
  getAppointmentByService,
  getAllPayments,
} = require("../controllers/statisticController");
 

const { getTimeslotById, getAvailableTimeslots, createTimeslot, updateTimeslot , deleteTimeslot, getSlotByDoctorId} = require("../controllers/timeslotController");

const multer = require("multer");
const path = require("path");
const { createAcountDoctor, getAllClinic, createAcountStaff, getAllPatient, getAllStaff, getAllDoctor, changeStatus, createService, getAllService, uploadImageCloudinary, deleteService, editService, getAllServicebyManager } = require("../controllers/adminController");
const { getDefaultResultOrder } = require("dns");
const chatbotController = require("../controllers/chat/chatbotController");
const chatboxController = require("../controllers/chat/chatboxController");
const { requestPasswordReset, verifyOTP, resetPassword } = require("../controllers/otpController");

const {
  createPayment,
  getPaymentStatus,
  getPaymentByOrderCode,
  cancelPayment,
} = require("../controllers/paymentController");

// Configure multer for file uploads (used for profile pictures and blog images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const uploadMulter = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG/PNG images are allowed"));
  },
});

const uploadMulterMemory = multer({
  storage: multer.memoryStorage(), // dùng bộ nhớ RAM
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG/PNG images are allowed"));
  },
});

// auth 
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/view/service", getAllService);
router.get("/view-detail/service/:id", getServiceDetail);
router.post("/changepass", authMiddleware, changePassword);

// update profile
router.get("/user/profile", authMiddleware, getUserProfile);
router.put("/user/profile", authMiddleware, updateUserProfile);
router.post(
  "/user/upload-picture-profile",
  authMiddleware,
  uploadMulterMemory.single("profilePicture"), 
  uploadPictureProfile
);

//appointment
// Lấy tất cả lịch hẹn
router.get('/admin/appointments', getAllAppointment);

// Sửa lịch hẹn theo PatientId và id
router.put('/appointments/:appointmentId',authPatientMiddleware, editAppointment);

// Xóa lịch hẹn theo id
router.delete('/:id', deleteAppointment);

// Route to get daily appointment count (last 30 days)
router.get('/appointment-trend', getAppointmentTrend);

// Route to get daily revenue (last 30 days)
router.get('/revenue-trend', getRevenueTrend);

// Route to get appointment status distribution (last 30 days)
router.get('/appointment-status-stats', getAppointmentStatusStats);

// Route to get revenue breakdown by payment method (last 30 days)
router.get('/revenue-by-method', getRevenueByMethod);

// Route to get revenue breakdown by payment type (last 30 days)
router.get('/revenue-by-type', getRevenueByType);

// Route to get dashboard summary KPIs
router.get('/summaries', getDashboardSummaries);

// Route to get appointment distribution by clinic (last 30 days)
router.get('/appointment-by-clinic', getAppointmentByClinic);

// Route to get appointment distribution by service (last 30 days)
router.get('/appointment-by-service', getAppointmentByService);

//get all payments
router.get("/admin/payments", getAllPayments);



// doctor 
router.post("/doctor/create-schedule", authDentistMiddleware, createSchedule);
router.get("/doctor/getScheduleByWeek", authDentistMiddleware, getScheduleByWeek);
router.get('/appointments/timeslot/:timeslotId', authDentistMiddleware, getAppointmentByTimeslot);
router.put(
  "/appointments/update-status-note/:appointmentId",
  authDentistMiddleware,
  updateAppointmentStatusAndNote
);

// Authentication
router.post("/logout", authMiddleware, logoutUser);
router.post("/reset-pass", requestPasswordReset);
router.post("/verify", verifyOTP);
router.post("/confirm-reset", resetPassword);
router.post("/gg-login", googleLogin);
router.put("/changepass", authMiddleware, changePassword);

// Timeslot
router.get("/timeslots/available", authMiddleware, getAvailableTimeslots);
router.get("/timeslots/:timeslotId", authMiddleware, getTimeslotById);
router.post("/timeslots", authDentistMiddleware, createTimeslot); 
router.put("/timeslots/:timeslotId", authDentistMiddleware, updateTimeslot);
router.delete(
  "/timeslots/:timeslotId",
  authDentistOrAdminMiddleware,
  deleteTimeslot
);

// Doctor
router.get("/doctor", getAllDoctors);
router.get("/doctor/:doctorId", getDoctorById);
router.put(
  "/doctor/:doctorId",
  authAdminMiddleware,
  uploadMulter.single("ProfileImage"), 
  updateDoctor
);
router.get("/doctoraccount", authAdminMiddleware, getAllDoctors);
router.put("/doctor/:doctorId/status", authAdminMiddleware, updateDoctorStatus);

// admin 
router.post("/admin/create-account-doctor", authAdminMiddleware, createAcountDoctor);
router.get("/clinic", getAllClinic);
router.post("/admin/create-account-staff", authAdminMiddleware, createAcountStaff);
router.get("/admin-accountpatient", authAdminMiddleware, getAllPatient);
router.get("/admin-accountdoctor", authAdminMiddleware, getAllDoctor);
router.get("/admin-accountstaff", authAdminMiddleware, getAllStaff);
router.patch('/admin/update-status/:role/:recordId', authAdminMiddleware, changeStatus);
router.get("/admin/viewallservicebymanager", authAdminMiddleware, getAllServicebyManager);
router.post("/admin/create/service", authAdminMiddleware, createService);
router.post("/admin/upload-image", authAdminMiddleware, uploadMulter.single("image"), uploadImageCloudinary);
router.delete("/admin/delete-service/:id", authAdminMiddleware, deleteService);
router.put("/admin/update-service/:id", authAdminMiddleware, uploadMulter.single("image"), editService);


// Blog
router.get("/blogs", getAllBlogs);
router.get("/admin/blogs", authAdminMiddleware, getAllBlogsForAdmin);
router.post("/blogs", authAdminMiddleware, createBlog);
router.put("/blogs/:id", authAdminMiddleware, updateBlog);
router.delete("/blogs/:id", authAdminMiddleware, deleteBlog);
router.post("/blogs/upload", authAdminMiddleware,
  uploadMulter.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "contentImages", maxCount: 10 },
  ]),
  uploadImage
);
router.get("/categories", getAllCategories);
router.get("/admin/categories", authAdminMiddleware, getAllCategoriesForAdmin);
router.post("/categories", authAdminMiddleware, createCategory);
router.put("/categories/:id", authAdminMiddleware, updateCategory);
router.delete("/categories/:id", authAdminMiddleware, deleteCategory);
router.get("/blogs/slug/:slug", getBlogBySlug);
router.get("/blogs/top-viewed", getTopViewedBlogs);
router.post("/blogs/slug/:slug/views", incrementBlogViews);

// Chat
router.post("/chat/chatwithai", chatbotController.chatWithAI);
router.get("/chat/messages", chatboxController.getMessages);
router.post("/chat/send", chatboxController.sendMessage);

module.exports = router;