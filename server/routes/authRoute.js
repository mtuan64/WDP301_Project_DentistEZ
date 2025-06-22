const express = require("express");
const router = express.Router();
const { authMiddleware, authAdminMiddleware } = require("../middleware/authMiddleware");
const {getAllPatients} = require("../controllers/patientController");
const {getAllStaffs, updateStaffStatus} = require("../controllers/staffController");
const {
  registerUser,
  loginUser,
  uploadProfilePicture,
  updateUser,
  upload,
  logoutUser
} = require("../controllers/authController");
const {
  getAllDoctors,
  getDoctorById,
  updateDoctorStatus
} = require("../controllers/doctorController");
const {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadImage,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBlogBySlug,
  getTopViewedBlogs,
  incrementBlogViews
} = require("../controllers/blogController");
const multer = require("multer");
const path = require("path");
const { requestPasswordReset, verifyOTP, resetPassword } = require("../controllers/otpController");

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


// Authentication
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.get("/doctor", getAllDoctors);
router.get("/doctor/:doctorId", getDoctorById);
router.post(
  "/user/upload-profile-picture",
  authMiddleware,
  uploadMulter.single("profilePicture"),
  uploadProfilePicture
);
router.post("/user/update", authMiddleware, updateUser);

//Admin control account user
router.get("/patients", authAdminMiddleware, getAllPatients);
router.get("/staff", authAdminMiddleware, getAllStaffs);
router.get("/docroraccount", authAdminMiddleware, getAllDoctors);
router.put("/doctor/:doctorId/status", authAdminMiddleware, updateDoctorStatus);
router.put("/staff/:staffId/status", authAdminMiddleware, updateStaffStatus);

//Blog
router.get("/blogs", getAllBlogs);
router.post("/blogs", authAdminMiddleware, createBlog);
router.put("/blogs/:id", authAdminMiddleware, updateBlog);
router.delete("/blogs/:id", authAdminMiddleware, deleteBlog);
router.post(
  "/blogs/upload",
  authAdminMiddleware,
  uploadMulter.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "contentImages", maxCount: 10 }, 
  ]),
  uploadImage
);
router.get("/categories", getAllCategories);
router.post("/categories", authAdminMiddleware, createCategory);
router.put("/categories/:id", authAdminMiddleware, updateCategory);
router.delete("/categories/:id", authAdminMiddleware, deleteCategory);
router.get("/blogs/slug/:slug", getBlogBySlug);
router.get("/blogs/top-viewed", getTopViewedBlogs);
router.post("/blogs/slug/:slug/views", incrementBlogViews);


module.exports = router;
