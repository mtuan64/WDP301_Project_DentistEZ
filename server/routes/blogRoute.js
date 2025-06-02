const express = require("express");
const {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadImage,
} = require("../controllers/blogController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.get("/", getAllBlogs);
router.post("/", createBlog);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);
router.post("/upload", upload.single("image"), uploadImage);

module.exports = router;
