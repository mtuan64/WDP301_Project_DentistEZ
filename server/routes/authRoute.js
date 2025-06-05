const express = require("express");
const router = express.Router();
const { authMiddleware, authAdminMiddleware } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  uploadProfilePicture,
  updateUser,
  upload,
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
} = require("../controllers/blogController");
const multer = require("multer");
const path = require("path");

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

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/doctor", getAllDoctors);
router.get("/doctor/:doctorId", getDoctorById);
router.post(
  "/user/upload-profile-picture",
  authMiddleware,
  uploadMulter.single("profilePicture"),
  uploadProfilePicture
);
router.post("/user/update", authMiddleware, updateUser);

router.get("/docroraccount", authAdminMiddleware, getAllDoctors);
router.put("/doctor/:doctorId/status", authAdminMiddleware, updateDoctorStatus);

router.get("/blogs", authAdminMiddleware, getAllBlogs); 
router.post("/blogs", authAdminMiddleware, createBlog); 
router.put("/blogs/:id", authAdminMiddleware, updateBlog); 
router.delete("/blogs/:id", authAdminMiddleware, deleteBlog);
router.post("/blogs/upload", authAdminMiddleware, uploadMulter.single("image"), uploadImage);

module.exports = router;
