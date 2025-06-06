const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this folder exists
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
    cb(new Error('Only JPEG/PNG images are allowed'));
  },
});




exports.registerUser = async (req, res, next) => {
  try {
    const {
      username,
      password,
      fullname,
      email,
      phone,
      address,
      dob,
      gender,
      role,
    } = req.body;

    // Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ msg: 'Người dùng đã tồn tại!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      fullname,
      email,
      phone,
      address,
      dateOfBirth: dob,
      gender,
      role,
    });

    await newUser.save();

    res.status(201).json({
      id: newUser._id,
      username: newUser.username,
      fullname: newUser.fullname,
      email: newUser.email,
      phone: newUser.phone,
      address: newUser.address,
      dateOfBirth: newUser.dateOfBirth,
      gender: newUser.gender,
      role: newUser.role,
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({ msg: 'Vui lòng nhập đầy đủ email và mật khẩu.' });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'Người dùng không tồn tại.' });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ msg: 'Mật khẩu không đúng.' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '20h' }
    );

    // Trả về token và thông tin user
    res.status(200).json({
      msg: 'Đăng nhập thành công.',
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
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ msg: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' });
  }
};




exports.uploadProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user.userId; // From authMiddleware
    const file = req.file;

    if (!file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const profilePictureUrl = `/uploads/${file.filename}`;
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePictureUrl },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(200).json({
      msg: 'Profile picture uploaded successfully',
      profilePictureUrl,
    });
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    res.status(500).json({ msg: 'Failed to upload profile picture' });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.user.userId; // From authMiddleware
    const { fullname, email, phone, address, dateOfBirth, gender, profilePicture } = req.body;

    // Validate required fields
    if (!fullname || !email) {
      return res.status(400).json({ msg: 'Fullname and email are required' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already in use' });
    }

    // Update user
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
    );

    if (!updatedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(200).json({
      msg: 'User updated successfully',
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
    console.error('Error in updateUser:', error);
    res.status(500).json({ msg: 'Failed to update user' });
  }
};

// Get all user accounts
exports.getAllUserAccounts = async (req, res) => {
  try {
    // Ensure only admin can access this endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin role required.' });
    }

    // Extract query parameters for pagination, filtering, and sorting
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query object
    const query = {};
    if (search) {
      // Search by username, fullname, or email (case-insensitive)
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination values
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Define sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch users from database, excluding password field
    const users = await User.find(query)
      .select('-password') // Exclude password field
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(); // Convert to plain JavaScript object for better performance

    // Get total count for pagination metadata
    const totalUsers = await User.countDocuments(query);

    // Prepare response
    const response = {
      success: true,
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers,
        limit: limitNum,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching all user accounts:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// Get users by role
exports.getUserByRole = async (req, res) => {
  try {
    // Ensure only admin can access this endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin role required.' });
    }

    // Extract query parameters for pagination and role filtering
    const { page = 1, limit = 10, role } = req.query;

    // Validate role parameter
    if (!role || !['patient', 'doctor', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid or missing role parameter' });
    }

    // Calculate pagination values
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Fetch users by role, excluding password field
    const users = await User.find({ role })
      .select('-password') // Exclude password field
      .skip(skip)
      .limit(limitNum)
      .lean(); // Convert to plain JavaScript object for better performance

    // Get total count for pagination metadata
    const totalUsers = await User.countDocuments({ role });

    // Prepare response
    const response = {
      success: true,
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers,
        limit: limitNum,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// Export multer upload for use in routes
exports.upload = upload;