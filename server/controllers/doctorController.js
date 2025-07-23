const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const TimeSlot = require("../models/TimeSlot");
const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;
const path = require("path");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../Uploads");
fs.mkdir(uploadDir, { recursive: true })
  .then(() => console.log("Uploads directory created or exists"))
  .catch((err) => console.error("Error creating uploads directory:", err));

// Lấy danh sách tất cả bác sĩ
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("userId", "fullname")
      .populate("clinic_id", "clinic_name description");
    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bác sĩ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách bác sĩ",
      error: error.message,
    });
  }
};

// Lấy thông tin bác sĩ theo ID
exports.getDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "doctorId không hợp lệ",
      });
    }

    const doctor = await Doctor.findById(doctorId)
      .populate("userId", "fullname")
      .populate("clinic_id", "clinic_name description");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bác sĩ",
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin bác sĩ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin bác sĩ",
      error: error.message,
    });
  }
};

// Cập nhật trạng thái bác sĩ
exports.updateDoctorStatus = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { Status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "doctorId không hợp lệ",
      });
    }

    if (!["active", "inactive"].includes(Status)) {
      return res.status(400).json({
        success: false,
        message:
          "Trạng thái không hợp lệ. Chỉ chấp nhận 'active' hoặc 'inactive'.",
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { Status },
      { new: true, runValidators: true }
    )
      .populate("userId", "fullname")
      .populate("clinic_id", "clinic_name description");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bác sĩ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái bác sĩ thành công",
      data: doctor,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái bác sĩ:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái bác sĩ",
      error: error.message,
    });
  }
};

// Cập nhật thông tin bác sĩ
exports.updateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { Specialty, Degree, ExperienceYears, Description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "doctorId không hợp lệ",
      });
    }

    // Validate input
    if (
      !Specialty ||
      !Degree ||
      ExperienceYears === undefined ||
      ExperienceYears === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng cung cấp đầy đủ thông tin: Specialty, Degree, và ExperienceYears",
      });
    }

    // Validate ExperienceYears
    const parsedExperienceYears = Number(ExperienceYears);
    if (isNaN(parsedExperienceYears) || parsedExperienceYears < 0) {
      return res.status(400).json({
        success: false,
        message: "ExperienceYears phải là số không âm",
      });
    }

    // Handle ProfileImage upload
    let profileImageUrl = req.body.ProfileImage || "";
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "doctor_profiles",
        });
        profileImageUrl = result.secure_url;
        await fs.unlink(req.file.path).catch(console.error);
      } catch (cloudinaryError) {
        console.error("Lỗi khi tải ảnh lên Cloudinary:", cloudinaryError);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi tải ảnh lên Cloudinary",
          error: cloudinaryError.message,
        });
      }
    }

    // Find and update doctor
    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      {
        Specialty,
        Degree,
        ExperienceYears: parsedExperienceYears,
        Description,
        ProfileImage: profileImageUrl,
      },
      { new: true, runValidators: true }
    )
      .populate("userId", "fullname")
      .populate("clinic_id", "clinic_name description");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bác sĩ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin bác sĩ thành công",
      data: doctor,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin bác sĩ:", error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật thông tin bác sĩ",
      error: error.message,
    });
  }
};

// Tạo lịch làm việc cho bác sĩ
exports.createSchedule = async (req, res) => {
  try {
    const { selected_slots, dates } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bác sĩ",
      });
    }

    const doctorId = doctor._id;

    if (
      !Array.isArray(selected_slots) ||
      !Array.isArray(dates) ||
      !selected_slots.length ||
      !dates.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ca và ngày",
      });
    }

    if (
      !selected_slots.every(
        (slot) => typeof slot === "number" && slot >= 1 && slot <= 9
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Ca không hợp lệ, phải từ 1 đến 9",
      });
    }

    const defaultSlots = [
      { slot_index: 1, start_time: "08:00", end_time: "09:00" },
      { slot_index: 2, start_time: "09:00", end_time: "10:00" },
      { slot_index: 3, start_time: "10:00", end_time: "11:00" },
      { slot_index: 4, start_time: "14:00", end_time: "15:00" },
      { slot_index: 5, start_time: "15:00", end_time: "16:00" },
      { slot_index: 6, start_time: "16:00", end_time: "17:00" },
      { slot_index: 7, start_time: "17:00", end_time: "18:00" },
      { slot_index: 8, start_time: "18:00", end_time: "19:00" },
      { slot_index: 9, start_time: "19:00", end_time: "20:00" },
    ];

    const slots = [];

    for (const dateStr of dates) {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: `Ngày không hợp lệ: ${dateStr}`,
        });
      }

      for (const slotIndex of selected_slots) {
        const defaultSlot = defaultSlots.find(
          (s) => s.slot_index === slotIndex
        );
        if (defaultSlot) {
          const exists = await TimeSlot.exists({
            doctorId,
            date,
            slot_index: slotIndex,
          });
          if (!exists) {
            slots.push({
              doctorId,
              date,
              slot_index: slotIndex,
              start_time: defaultSlot.start_time,
              end_time: defaultSlot.end_time,
              isAvailable: true,
              status: "active",
            });
          }
        }
      }
    }

    if (slots.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Tất cả các ca đã tồn tại. Không có ca mới được tạo.",
        created_count: 0,
      });
    }

    const result = await TimeSlot.insertMany(slots);

    return res.status(201).json({
      success: true,
      message: `Tạo thành công ${result.length} ca!`,
      created_count: result.length,
    });
  } catch (error) {
    console.error("Lỗi khi tạo lịch làm việc:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo lịch làm việc",
      error: error.message,
    });
  }
};

// Lấy lịch làm việc theo tuần
exports.getScheduleByWeek = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "userId không hợp lệ",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "startDate hoặc endDate không hợp lệ",
      });
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bác sĩ",
      });
    }

    const slots = await TimeSlot.find({
      doctorId: doctor._id,
      date: {
        $gte: start,
        $lte: end,
      },
    }).sort({ date: 1, slot_index: 1 });

    return res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch làm việc theo tuần:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch làm việc",
      error: error.message,
    });
  }
};
