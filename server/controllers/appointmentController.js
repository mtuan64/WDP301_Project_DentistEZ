const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');
const Appointment = require('../models/Appointment');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const Patient = require('../models/Patient')
const Service = require('../models/Service');
const Clinic = require('../models/Clinic');
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log('Entering editAppointment');
    const { appointmentId } = req.params;
    const { timeslotId, note } = req.body;
    const user = req.user; 

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
    const appointment = await Appointment.findById(appointmentId).session(session);
    console.log('Appointment found:', !!appointment);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn',
      });
    }

    // Authorization check
    const patient = await Patient.findOne({ userId: user.id }).session(session);
    if (user.role !== 'admin' && appointment.patientId.toString() !== patient?._id?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa lịch hẹn này',
      });
    }

    // Check appointment status
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Không thể chỉnh sửa lịch hẹn đã hoàn thành hoặc đã hủy',
      });
    }

    // Validate and sanitize note
    if (note && note.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Ghi chú không được vượt quá 500 ký tự',
      });
    }
    const sanitizedNote = note ? sanitizeHtml(note, { allowedTags: [], allowedAttributes: {} }) : note;

    const updateData = { updatedAt: new Date() };
    if (timeslotId) {
      // Validate timeslotId
      console.log('Validating timeslotId');
      if (!mongoose.Types.ObjectId.isValid(timeslotId)) {
        console.log('Invalid timeslotId:', timeslotId);
        return res.status(400).json({
          success: false,
          message: 'timeslotId không hợp lệ',
        });
      }

      // Check if timeslot exists
      console.log('Checking if timeslot exists');
      const timeslot = await TimeSlot.findById(timeslotId).session(session);
      console.log('Timeslot found:', !!timeslot);
      if (!timeslot) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khung giờ',
        });
      }

      // Check if the timeslot is at least 8 hours from now (in UTC)
      console.log('Checking timeslot timing');
      const currentTime = new Date(); // Consider using moment.tz('UTC') for consistency
      const timeslotDateTime = new Date(`${timeslot.date}T${timeslot.start_time}`);
      const eightHoursInMs = 8 * 60 * 60 * 1000;

      if (timeslotDateTime - currentTime < eightHoursInMs) {
        return res.status(400).json({
          success: false,
          message: 'Không thể chỉnh sửa lịch hẹn trong vòng 8 tiếng trước khi bắt đầu',
        });
      }

      // Check if timeslot is available (not booked by another appointment)
      console.log('Checking for existing appointment with timeslot');
      const existingAppointment = await Appointment.findOne({
        timeslotId,
        _id: { $ne: appointmentId },
        status: { $ne: 'cancelled' },
      }).session(session);
      console.log('Existing appointment check:', !!existingAppointment);
      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Khung giờ này đã được đặt, vui lòng chọn khung giờ khác',
        });
      }

      // If changing timeslot, restore availability of the old timeslot
      if (timeslotId !== appointment.timeslotId.toString()) {
        const oldTimeslot = await TimeSlot.findById(appointment.timeslotId).session(session);
        if (oldTimeslot) {
          oldTimeslot.isAvailable = true;
          await oldTimeslot.save();
        }
        timeslot.isAvailable = false;
        await timeslot.save();
      }
      updateData.timeslotId = timeslotId;
    }
    if (sanitizedNote) {
      updateData.note = sanitizedNote;
    }

    // Update appointment
    console.log('Updating appointment');
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true, runValidators: true, session }
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

    await session.commitTransaction();
    console.log('Sending response');
    res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: 'Cập nhật lịch hẹn thành công',
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in editAppointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch hẹn',
      error: error.message,
    });
  } finally {
    session.endSession();
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


module.exports = {
  getAllAppointment,
  getAppointmentByTimeslot,
  getAppointmentsByPatient,
  cancelAppointmentWithRefund,
  createAppointment,
  editAppointment,
  editAppointmentByPatientId,
  deleteAppointment,
};