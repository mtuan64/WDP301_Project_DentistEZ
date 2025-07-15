const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const TimeSlot = require("../models/TimeSlot");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Service = require("../models/Service");
const Clinic = require("../models/Clinic");
// Lấy tất cả lịch hẹn (admin)
const getAllAppointment = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patientId", "name")
      .populate("doctorId", "name")
      .populate("staffId", "name")
      .populate("serviceId", "name")
      .populate("clinicId", "name")
      .populate("timeslotId")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách lịch hẹn",
      error: error.message,
    });
  }
};

// Lấy lịch hẹn của bệnh nhân
const getAppointmentsByPatient = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "userId không hợp lệ",
      });
    }

    // Find the patient associated with the userId
    const patient = await Patient.findOne({ userId }).select("_id");
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch đặt",
      });
    }

    // Fetch appointments for the patientId
    const appointments = await Appointment.find({ patientId: patient._id })
      .populate({
        path: "patientId",
        select: "userId",
        populate: {
          path: "userId",
          model: "User",
          select: "fullname email phone address dateOfBirth gender",
        },
      })
      .populate({
        path: "doctorId",
        select: "userId",
        populate: {
          path: "userId",
          model: "User",
          select: "fullname",
        },
      })
      .populate({
        path: "staffId",
        select: "userId",
        populate: {
          path: "userId",
          model: "User",
          select: "fullname",
        },
      })
      .populate({
        path: "serviceId",
        select: "serviceName",
      })
      .populate({
        path: "clinicId",
        select: "clinic_name",
      })
      .populate({
        path: "timeslotId",
        select: "date start_time end_time",
      })
      .sort({ createdAt: -1 });

    // Return patient info and appointments
    res.status(200).json({
      success: true,
      data: {
        patient:
          appointments.length > 0 ? appointments[0].patientId.userId : null,
        appointments: appointments.length > 0 ? appointments : [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch hẹn theo userId",
      error: error.message,
    });
  }
};

// Tạo lịch hẹn mới
const createAppointment = async (req, res) => {
  try {
    const data = req.body;

    const newAppointment = await Appointment.create(data);

    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate("patientId", "name")
      .populate("doctorId", "name")
      .populate("staffId", "name")
      .populate("serviceId", "name")
      .populate("clinicId", "name");

    res.status(201).json({
      success: true,
      data: populatedAppointment,
      message: "Tạo lịch hẹn thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo lịch hẹn",
      error: error.message,
    });
  }
};

// Sửa lịch hẹn
const editAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch hẹn" });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("patientId", "name")
      .populate("doctorId", "name")
      .populate("staffId", "name")
      .populate("serviceId", "name")
      .populate("clinicId", "name");

    res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: "Cập nhật lịch hẹn thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật lịch hẹn",
      error: error.message,
    });
  }
};

// Xóa lịch hẹn
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch hẹn" });
    }

    await Appointment.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Xóa lịch hẹn thành công" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa lịch hẹn",
      error: error.message,
    });
  }
};

// Hủy lịch hẹn + nhập STK
const cancelAppointmentWithRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAccount } = req.body;

    if (!refundAccount) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp số tài khoản ngân hàng để hoàn tiền",
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn",
      });
    }

    // Tìm hồ sơ bệnh nhân của người dùng đang đăng nhập
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ bệnh nhân của bạn",
      });
    }

    // Kiểm tra quyền hủy lịch
    if (appointment.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền hủy lịch hẹn này",
        status: "ERROR",
      });
    }

    // Cập nhật trạng thái và lưu STK
    appointment.status = "cancelled";
    appointment.refundAccount = refundAccount;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Hủy lịch hẹn thành công, đã lưu STK hoàn tiền",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy lịch hẹn",
      error: error.message,
    });
  }
};

module.exports = {
  getAllAppointment,
  getAppointmentsByPatient,
  createAppointment,
  editAppointment,
  deleteAppointment,
  cancelAppointmentWithRefund,
};
