const Appointment = require("../models/Appointment");

// Lấy tất cả lịch hẹn
const getAllAppointment = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('PatientId', 'name') // Chỉ lấy tên bệnh nhân
      .populate('DoctorId', 'name')  // Chỉ lấy tên bác sĩ
      .populate('StaffId', 'name')   // Chỉ lấy tên nhân viên
      .populate('serviceid', 'name') // Chỉ lấy tên dịch vụ
      .populate('clinic_id', 'name') // Chỉ lấy tên phòng khám
      .sort({ AppointmentDate: -1 }); // Sắp xếp theo ngày mới nhất

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lịch hẹn',
      error: error.message
    });
  }
};

// Tạo lịch hẹn mới
const createAppointment = async (req, res) => {
  try {
    const {
      PatientId,
      DoctorId,
      StaffId,
      serviceid,
      clinic_id,
      AppointmentDate,
      AppointmentTime,
      Status,
      Note
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!PatientId || !DoctorId || !StaffId || !serviceid || !clinic_id || !AppointmentDate || !AppointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc'
      });
    }

    const newAppointment = await Appointment.create({
      PatientId,
      DoctorId,
      StaffId,
      serviceid,
      clinic_id,
      AppointmentDate,
      AppointmentTime,
      Status: Status || 'pending',
      Note
    });

    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate('PatientId', 'name')
      .populate('DoctorId', 'name')
      .populate('StaffId', 'name')
      .populate('serviceid', 'name')
      .populate('clinic_id', 'name');

    res.status(201).json({
      success: true,
      data: populatedAppointment,
      message: 'Tạo lịch hẹn thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lịch hẹn',
      error: error.message
    });
  }
};

// Sửa lịch hẹn
const editAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Kiểm tra xem lịch hẹn có tồn tại
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    // Cập nhật lịch hẹn
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('PatientId', 'name')
      .populate('DoctorId', 'name')
      .populate('StaffId', 'name')
      .populate('serviceid', 'name')
      .populate('clinic_id', 'name');

    res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: 'Cập nhật lịch hẹn thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch hẹn',
      error: error.message
    });
  }
};

// Xóa lịch hẹn
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem lịch hẹn có tồn tại
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    await Appointment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Xóa lịch hẹn thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch hẹn',
      error: error.message
    });
  }
};

module.exports = {
  getAllAppointment,
  createAppointment,
  editAppointment,
  deleteAppointment
};