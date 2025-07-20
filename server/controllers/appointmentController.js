const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const Patient = require('../models/Patient')
const Service = require('../models/Service');
const Clinic = require('../models/Clinic');
const Doctor = require("../models/Doctor");
// Lấy tất cả lịch hẹn

const getAllAppointment = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: "patientId",
        select: "userId",
        populate: {
          path: "userId",
          model: "User",
          select: "fullname",
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
      });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách lịch hẹn",
      error: error.message,
    });
  }
};

// Lấy lịch hẹn theo timeslotId
const getAppointmentByTimeslot = async (req, res) => {
  try {
    const { timeslotId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(timeslotId)) {
      return res.status(400).json({
        success: false,
        message: 'timeslotId không hợp lệ',
      });
    }

    const appointment = await Appointment.findOne({ timeslotId })
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
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cuộc hẹn cho timeslot này",
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error in getAppointmentByTimeslot:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
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
    const { patientId, doctorId, serviceId, serviceOptionId, clinicId, timeslotId, note } = req.body;

    if (!patientId || !doctorId || !serviceId || !clinicId || !timeslotId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc',
      });
    }

    // Kiểm tra timeslot có trống không
    const timeslot = await TimeSlot.findById(timeslotId);
    if (!timeslot || !timeslot.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ không tồn tại hoặc đã được đặt',
      });
    }

    const newAppointment = await Appointment.create({
      patientId,
      doctorId,
      serviceId,
      serviceOptionId,
      clinicId,
      timeslotId,
      note,
      createdBy: req.user.id,
    });

    // Cập nhật timeslot thành không trống
    timeslot.isAvailable = false;
    await timeslot.save();

    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .populate('serviceId', 'serviceName')
      .populate('clinicId', 'name')
      .populate('timeslotId', 'date start_time end_time');

    res.status(201).json({
      success: true,
      data: populatedAppointment,
      message: 'Tạo lịch hẹn thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lịch hẹn',
      error: error.message,
    });
  }
};

const editAppointment = async (req, res) => {
  try {
    console.log('Entering editAppointment');
    const { appointmentId } = req.params;
    console.log('Received appointmentId:', appointmentId);
    console.log('Request body:', req.body);
    const { timeslotId, note } = req.body;

    // Validate appointmentId
    if (!appointmentId) {
      console.log('Missing appointmentId');
      return res.status(400).json({
        success: false,
        message: 'appointmentId is missing or undefined',
      });
    }
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      console.log('Invalid appointmentId:', appointmentId);
      return res.status(400).json({
        success: false,
        message: `appointmentId không hợp lệ: ${appointmentId}`,
      });
    }

    // Check if appointment exists
    console.log('Checking if appointment exists');
    const appointment = await Appointment.findById(appointmentId);
    console.log('Appointment found:', !!appointment);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn',
      });
    }

    // Validate timeslotId
    console.log('Validating timeslotId');
    if (!mongoose.Types.ObjectId.isValid(timeslotId)) {
      console.log('Invalid timeslotId:', timeslotId);
      return res.status(400).json({
        success: false,
        message: 'timeslotId không hợp lệ',
      });
    }

    // Check if timeslot exists and is available
    console.log('Checking if timeslot exists');
    const timeslot = await TimeSlot.findById(timeslotId); // Fixed: Use TimeSlot (uppercase 'S')
    console.log('Timeslot found:', !!timeslot);
    if (!timeslot) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khung giờ',
      });
    }

    // Check if timeslot is available (not booked by another appointment)
    console.log('Checking for existing appointment with timeslot');
    const existingAppointment = await Appointment.findOne({
      timeslotId,
      _id: { $ne: appointmentId },
      status: { $ne: 'cancelled' },
    });
    console.log('Existing appointment check:', !!existingAppointment);
    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã được đặt, vui lòng chọn khung giờ khác',
      });
    }

    // Update appointment
    console.log('Updating appointment');
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        timeslotId,
        note,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'patientId',
        select: 'userId',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'fullname email phone address dateOfBirth gender',
        },
      })
      .populate({
        path: 'doctorId',
        select: 'userId',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'fullname',
        },
      })
      .populate({
        path: 'staffId',
        select: 'userId',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'fullname',
        },
      })
      .populate({
        path: 'serviceId',
        select: 'serviceName',
      })
      .populate({
        path: 'clinicId',
        select: 'clinic_name',
      })
      .populate({
        path: 'timeslotId',
        select: 'date start_time end_time',
      });

    console.log('Appointment updated:', !!updatedAppointment);
    if (!updatedAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn để cập nhật',
      });
    }

    console.log('Sending response');
    res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: 'Cập nhật lịch hẹn thành công',
    });
  } catch (error) {
    console.error('Error in editAppointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch hẹn',
      error: error.message,
    });
  }
};
// Sửa lịch hẹn theo patientId
const editAppointmentByPatientId = async (req, res) => {
  try {
    const { patientId, id } = req.params;
    const { timeslotId, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'patientId hoặc ID lịch hẹn không hợp lệ',
      });
    }

    const appointment = await Appointment.findOne({ _id: id, patientId });
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn cho bệnh nhân này',
      });
    }

    // Nếu cập nhật timeslotId, kiểm tra và cập nhật trạng thái timeslot
    if (timeslotId && timeslotId !== appointment.timeslotId.toString()) {
      const newTimeslot = await TimeSlot.findById(timeslotId);
      if (!newTimeslot || !newTimeslot.isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Khung giờ mới không tồn tại hoặc đã được đặt',
        });
      }

      // Khôi phục trạng thái trống cho timeslot cũ
      const oldTimeslot = await TimeSlot.findById(appointment.timeslotId);
      if (oldTimeslot) {
        oldTimeslot.isAvailable = true;
        await oldTimeslot.save();
      }

      // Cập nhật timeslot mới
      newTimeslot.isAvailable = false;
      await newTimeslot.save();
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: { timeslotId, note } },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .populate('serviceId', 'serviceName')
      .populate('clinicId', 'name')
      .populate('timeslotId', 'date start_time end_time');

    res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: 'Cập nhật lịch hẹn thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch hẹn theo patientId',
      error: error.message,
    });
  }
};

// Xóa lịch hẹn
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ',
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn',
      });
    }

    // Khôi phục trạng thái trống cho timeslot
    const timeslot = await TimeSlot.findById(appointment.timeslotId);
    if (timeslot) {
      timeslot.isAvailable = true;
      await timeslot.save();
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

// Cập nhật trạng thái và ghi chú của lịch hẹn
const updateAppointmentStatusAndNote = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "appointmentId không hợp lệ",
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn",
      });
    }

    // Thêm log để debug
    console.log("Token userId:", req.user.id);
    console.log("Appointment doctorId:", appointment.doctorId.toString());

    // Cập nhật trạng thái nếu được cung cấp
    if (status) {
      if (
        !["confirmed", "cancelled", "completed", "fully_paid"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }
      appointment.status = status;
    }

    // Cập nhật ghi chú nếu được cung cấp
    if (note !== undefined) {
      appointment.note = note;
    }

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
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
      });

    res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: "Cập nhật trạng thái và ghi chú thành công",
    });
  } catch (error) {
    console.error("Error in updateAppointmentStatusAndNote:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái và ghi chú",
      error: error.message,
    });
  }
};


module.exports = {
  getAllAppointment,
  getAppointmentByTimeslot,
  getAppointmentsByPatient,
  cancelAppointmentWithRefund,
  createAppointment,
  editAppointment,
  editAppointmentByPatientId,
  deleteAppointment,
  updateAppointmentStatusAndNote,
};