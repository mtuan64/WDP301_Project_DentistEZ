const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
        status: "ERROR",
      });
    }
    return res.status(200).json({
      message: "Lấy thông tin người dùng thành công",
      status: "SUCCESS",
      data: user,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", {
      message: error.message,
      stack: error.stack,
      details: error.errors || error,
    });
    return res.status(500).json({
      message: error.message || "Lỗi server",
      status: "ERROR",
      details: error.errors || "No additional details",
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { fullname, phone, address, dateOfBirth, gender } = req.body;

    // Validate required fields
    if (!fullname) {
      return res.status(400).json({
        message: "Họ tên là bắt buộc",
        status: "ERROR",
      });
    }

    // Validate fullname
    const fullnameRegex = /^[a-zA-Z\sÀ-ỹ]{2,50}$/;
    if (!fullnameRegex.test(fullname)) {
      return res.status(400).json({
        message: "Họ tên phải từ 2-50 ký tự và chỉ chứa chữ cái",
        status: "ERROR",
      });
    }

    // Validate phone
    if (phone) {
      const phoneRegex = /^0[35789][0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          message:
            "Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09",
          status: "ERROR",
        });
      }
    }

    // Validate dateOfBirth
    let parsedDateOfBirth;
    if (dateOfBirth) {
      parsedDateOfBirth = new Date(dateOfBirth);
      const today = new Date();
      const minDate = new Date("1900-01-01");
      if (
        isNaN(parsedDateOfBirth.getTime()) ||
        parsedDateOfBirth > today ||
        parsedDateOfBirth < minDate
      ) {
        return res.status(400).json({
          message: "Ngày sinh phải từ năm 1900 đến hiện tại",
          status: "ERROR",
        });
      }
    }

    // Validate gender
    const validGenders = ["male", "female", "other", ""];
    if (gender && !validGenders.includes(gender)) {
      return res.status(400).json({
        message: "Giới tính không hợp lệ",
        status: "ERROR",
      });
    }

    // Validate address
    if (address && address.length > 200) {
      return res.status(400).json({
        message: "Địa chỉ không được vượt quá 200 ký tự",
        status: "ERROR",
      });
    }

    // Prepare update data (không bao gồm email)
    const updateData = {
      fullname,
      phone: phone || undefined,
      address: address || undefined,
      dateOfBirth: parsedDateOfBirth || undefined,
      gender: gender || undefined,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    console.log("Update data:", updateData);
    console.log("User ID:", req.user.id);

    // Check if user exists
    const currentUser = await User.findById(req.user.id).select("email");
    if (!currentUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
        status: "ERROR",
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
        status: "ERROR",
      });
    }

    return res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công",
      status: "SUCCESS",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin người dùng:", {
      message: error.message,
      stack: error.stack,
      details: error.errors || error,
    });
    return res.status(500).json({
      message: error.message || "Lỗi server",
      status: "ERROR",
      details: error.errors || "No additional details",
    });
  }
};

// Upload profile picture to Cloudinary
const uploadPictureProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng cung cấp file ảnh",
        status: "ERROR",
      });
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        message: "Kích thước ảnh không được vượt quá 5MB",
        status: "ERROR",
      });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        message: "Vui lòng chọn file ảnh (jpg, png, ...)",
        status: "ERROR",
      });
    }

    console.log("Received file:", req.file);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "profile_pictures",
            transformation: [
              { width: 500, height: 500, crop: "limit" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) {
              console.error("Lỗi khi upload ảnh lên Cloudinary:", error);
              return reject(error);
            }
            resolve(result);
          }
        )
        .end(req.file.buffer);
    });

    // Update user's profile picture URL
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profilePicture: result.secure_url } },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
        status: "ERROR",
      });
    }

    return res.status(200).json({
      message: "Upload ảnh đại diện thành công",
      status: "SUCCESS",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi upload ảnh đại diện:", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      message: error.message || "Lỗi server",
      status: "ERROR",
      details: error.message || "No additional details",
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadPictureProfile,
};
