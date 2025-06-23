const express = require("express");
const router = express.Router();
const { authMiddleware, authAdminMiddleware, authDentistMiddleware } = require("../middleware/authMiddleware");
const {registerUser,loginUser,uploadProfilePicture,updateUser,upload, getServiceDetail} = require("../controllers/authController");
const {getAllDoctors,getDoctorById,updateDoctorStatus, createSchedule, getSchedule, getScheduleByWeek, getSchedulebydoctorId} = require("../controllers/doctorController");
const {getAllBlogs,createBlog,updateBlog,deleteBlog,uploadImage,} = require("../controllers/blogController");
const multer = require("multer");
const path = require("path");
const { createAcountDoctor, getAllClinic, createAcountStaff, getAllPatient, getAllStaff, getAllDoctor, changeStatus,  createService, getAllService, uploadImageCloudinary, deleteService, editService } = require("../controllers/adminController");
const { getDefaultResultOrder } = require("dns");

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
// auth 
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/view/service", getAllService);
router.get("/view-detail/service/:id",getServiceDetail);


//doctor 
router.post("/doctor/create-schedule", authDentistMiddleware, createSchedule);
router.get("/doctor/getScheduleByWeek", authDentistMiddleware, getScheduleByWeek);
router.get("/doctor", getAllDoctors);
router.get("/doctor/:doctorId", getDoctorById);


router.post("/user/upload-profile-picture",authMiddleware,uploadMulter.single("profilePicture"),uploadProfilePicture);
router.post("/user/update", authMiddleware, updateUser);
router.get("/docroraccount", authAdminMiddleware, getAllDoctors);
router.put("/doctor/:doctorId/status", authAdminMiddleware, updateDoctorStatus);



// admin 
router.get("/blogs", authAdminMiddleware, getAllBlogs); 
router.post("/blogs", authAdminMiddleware, createBlog); 
router.put("/blogs/:id", authAdminMiddleware, updateBlog); 
router.delete("/blogs/:id", authAdminMiddleware, deleteBlog);
router.post("/blogs/upload", authAdminMiddleware, uploadMulter.single("image"), uploadImage);
router.post("/admin/create-account-doctor", authAdminMiddleware, createAcountDoctor);
router.get("/clinic",getAllClinic);
router.post("/admin/create-account-staff", authAdminMiddleware, createAcountStaff);
router.get("/admin-accountpatient", authAdminMiddleware, getAllPatient);
router.get("/admin-accountdoctor", authAdminMiddleware, getAllDoctor);
router.get("/admin-accountstaff", authAdminMiddleware, getAllStaff);
router.patch('/admin/update-status/:role/:recordId', authAdminMiddleware,changeStatus);
router.get("/admin/viewallservice",authAdminMiddleware, getAllService);
router.post("/admin/create/service",authAdminMiddleware, createService);
router.post("/admin/upload-image",authAdminMiddleware,uploadMulter.single("image"),uploadImageCloudinary);
router.delete("/admin/delete-service/:id",authAdminMiddleware,deleteService);
router.put("/admin/update-service/:id",authAdminMiddleware,uploadMulter.single("image"),editService);




module.exports = router;
