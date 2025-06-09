const Doctor = require("../models/Doctor");

exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("userId", "fullname email gender phone") // lấy các field cần từ User
      .exec();

    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error("Error in getAllDoctors:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getDoctorById = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId; // ID dạng string

    // Tìm theo _id
    const doctor = await Doctor.findById(doctorId).populate('userId', 'fullname');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bác sĩ"
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error("Error in getDoctorById:", error);
    return next(error);
  }
};

exports.updateDoctorStatus = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId; // ID dạng string
    const { Status } = req.body;

    // Kiểm tra trạng thái hợp lệ
    if (!['active', 'inactive'].includes(Status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ. Chỉ chấp nhận 'active' hoặc 'inactive'."
      });
    }

    // Tìm và cập nhật bác sĩ
    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { Status },
      { new: true, runValidators: true }
    ).populate('userId', 'fullname');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bác sĩ"
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error("Error in updateDoctorStatus:", error);
    return next(error);
  }
};
