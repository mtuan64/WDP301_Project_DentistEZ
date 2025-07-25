const Staff = require("../models/Staff");
const Appointment = require("../models/Appointment");
exports.getAllStaffs = async (req, res) => {
  try {
    const staffs = await Staff.find().populate("userId", "fullname email address gender phone").exec();
    res.status(200).json({
      success: true,
      data: staffs,
    });
  } catch (error) {
    console.error("Error in getAllStaffs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.updateStaffStatus = async (req, res, next) => {
  try {
    const staffId = req.params.staffId; // ID dạng string
    const { Status } = req.body;

    // Kiểm tra trạng thái hợp lệ
    if (!['active', 'inactive'].includes(Status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ. Chỉ chấp nhận 'active' hoặc 'inactive'."
      });
    }

    // Tìm và cập nhật nhân viên
    const staff = await Staff.findByIdAndUpdate(
      staffId,
      { Status },
      { new: true, runValidators: true }
    ).populate('userId', 'fullname');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên"
      });
    }

    return res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error("Error in updateStaffStatus:", error);
    return next(error);
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Hủy lịch hẹn thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy lịch hẹn",
      error: error.message,
    });
  }
};

