const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Staff = require("../models/Staff");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

// Danh sách đen để lưu token đã logout (thay bằng Redis trong production)
const tokenBlacklist = [];

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
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

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ msg: "No token provided" });
  }

  // Check if token is blacklisted
  if (tokenBlacklist.includes(token)) {
    return res.status(401).json({ msg: "Token has been invalidated" });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach userId and role to req
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ msg: "Invalid token" });
  }
};

// Check if doctor's profile is complete
const isDoctorProfileComplete = (user, doctor) => {
  return !(
    !user.fullname ||
    !user.phone ||
    !user.address ||
    !user.dateOfBirth ||
    !user.gender ||
    !doctor.Specialty ||
    !doctor.Degree ||
    doctor.ExperienceYears == null
  );
};

exports.registerUser = async (req, res, next) => {
  try {
    const { username, password, fullname, email, phone, address, dob, gender, role } = req.body;

    // Validate required fields
    if (!username || !password || !fullname || !email) {
      return res.status(400).json({ msg: "Username, password, fullname, and email are required" });
    }

    // Validate role
    const validRoles = ["patient", "doctor", "staff", "admin"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existingUser) {
      return res.status(400).json({ msg: "Người dùng đã tồn tại!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      fullname,
      email,
      phone,
      address,
      dateOfBirth: dob,
      gender,
      role: role || "patient",
    });

    const savedUser = await newUser.save();

    switch (newUser.role) {
      case "patient":
        await new Patient({ userId: savedUser._id }).save();
        break;
      case "doctor":
        await new Doctor({ userId: savedUser._id }).save();
        break;
      case "staff":
        await new Staff({ userId: savedUser._id }).save();
        break;
    }

    res.status(201).json({
      id: savedUser._id,
      username: savedUser.username,
      fullname: savedUser.fullname,
      email: savedUser.email,
      phone: savedUser.phone,
      address: savedUser.address,
      dateOfBirth: savedUser.dateOfBirth,
      gender: savedUser.gender,
      role: savedUser.role,
    });
  } catch (error) {
    console.error("Error in registerUser:", error.message);
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Vui lòng nhập đầy đủ email và mật khẩu." });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ msg: "Người dùng không tồn tại." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ msg: "Mật khẩu không đúng." });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "20h",
    });

    res.status(200).json({
      msg: "Đăng nhập thành công.",
      token,
      user: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error.message);
    res.status(500).json({ msg: "Đã có lỗi xảy ra. Vui lòng thử lại sau." });
  }
};


exports.uploadProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const profilePictureUrl = `/uploads/${file.filename}`;
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePictureUrl },
      { new: true, runValidators: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({
      msg: "Profile picture uploaded successfully",
      profilePictureUrl,
    });
  } catch (error) {
    console.error("Error in uploadProfilePicture:", error.message);
    res.status(500).json({ msg: "Failed to upload profile picture" });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { fullname, email, phone, address, dateOfBirth, gender, profilePicture } = req.body;

    if (!fullname || !email) {
      return res.status(400).json({ msg: "Fullname and email are required" });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } }).lean();
    if (existingUser) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullname,
        email,
        phone,
        address,
        dateOfBirth,
        gender,
        profilePicture,
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({
      msg: "User updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        fullname: updatedUser.fullname,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error in updateUser:", error.message);
    res.status(500).json({ msg: "Failed to update user" });
  }
};

exports.getAllUserAccounts = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin role required." });
    }

    const { page = 1, limit = 10, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { fullname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const users = await User.find(query)
      .select("-password")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching all user accounts:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.getUserByRole = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin role required." });
    }

    const { page = 1, limit = 10, role } = req.query;

    if (!role || !["patient", "doctor", "staff", "admin"].includes(role)) {
      return res.status(400).json({ msg: "Invalid or missing role parameter" });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find({ role })
      .select("-password")
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalUsers = await User.countDocuments({ role });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching users by role:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ msg: "No token provided" });
    }

    // Kiểm tra nếu token đã bị blacklist (dù không cần thiết vì sẽ thêm lại)
    if (exports.isTokenBlacklisted(token)) {
      return res.status(401).json({ msg: "Token has already been invalidated" });
    }

    // Thêm token vào blacklist để invalidate
    tokenBlacklist.push(token);

    // Gửi phản hồi thành công để client thực hiện cleanup (xóa localStorage, navigate)
    res.status(200).json({ 
      msg: "Logged out successfully", 
      success: true 
    });
  } catch (error) {
    console.error("Error during logout:", error.message);
    res.status(500).json({ msg: "Failed to logout", error: error.message });
  }
};

exports.isTokenBlacklisted = (token) => {
  return tokenBlacklist.includes(token);
};

// Export multer upload for use in routes
exports.upload = upload;

// Export authMiddleware for use in routes
exports.authMiddleware = authMiddleware;