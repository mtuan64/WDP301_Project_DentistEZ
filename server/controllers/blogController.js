const Blog = require("../models/Blog");
const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;
const path = require("path");

const uploadDir = path.join(__dirname, "../uploads");
fs.mkdir(uploadDir, { recursive: true }).catch((err) =>
  console.error("Error creating uploads directory:", err)
);

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate("author_id", "fullname email");
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, content, image } = req.body;
    const author_id = req.user.userId;
    const newBlog = new Blog({ title, content, author_id, image });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image } = req.body;
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { title, content, image, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBlog = await Blog.findByIdAndDelete(id);
    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const file = req.file; // File uploaded via multer
    console.log("File received:", file);
    if (!file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "blog_images",
    });
    console.log("Cloudinary upload result:", result);
    // Delete local file after upload
    await fs.unlink(file.path).catch((err) => {
      console.error("Error deleting local file:", err);
    });
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error("Cloudinary upload error:", error.message, error.stack);
    res.status(500).json({
      message: "Failed to upload image to Cloudinary",
      error: error.message,
    });
  }
};
