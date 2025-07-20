
const sanitizeHtml = require('sanitize-html');
const Doctor = require("../models/Doctor");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const TimeSlot = require("../models/TimeSlot");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Service = require("../models/Service");
const Clinic = require("../models/Clinic");
const Refund = require("../models/Refund");
const Payment = require("../models/Payment");
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
        message: "timeslotId không hợp lệ",
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
        path: "serviceOptionId",
        select: "optionName price image",
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
    const {
      patientId,
      doctorId,
      serviceId,
      serviceOptionId,
      clinicId,
      timeslotId,
      note,
    } = req.body;

    if (!patientId || !doctorId || !serviceId || !clinicId || !timeslotId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin bắt buộc",
      });
    }

    // Kiểm tra timeslot có trống không
    const timeslot = await TimeSlot.findById(timeslotId);
    if (!timeslot || !timeslot.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Khung giờ không tồn tại hoặc đã được đặt",
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
      .populate("patientId", "name")
      .populate("doctorId", "name")
      .populate("serviceId", "serviceName")
      .populate("clinicId", "name")
      .populate("timeslotId", "date start_time end_time");

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

const editAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { appointmentId } = req.params;
    const { timeslotId, note } = req.body || {};
    const user = req.user;

    // Validate appointmentId
    if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ',
      });
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId).session(session);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn",
      });
    }

    // Kiểm tra userId hợp lệ
    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Dữ liệu người dùng không hợp lệ',
      });
    }

    // Tìm hồ sơ bệnh nhân
    const patient = await Patient.findOne({ userId: user.userId }).session(session);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bệnh nhân',
      });
    }

    // Chỉ cho phép chỉnh sửa nếu là admin hoặc là chủ lịch hẹn
    if (user.role !== 'admin' && appointment.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa lịch hẹn này',
      });
    }

    // Không cho phép chỉnh sửa nếu lịch hẹn đã hoàn thành hoặc hủy
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể chỉnh sửa lịch hẹn đã hoàn thành hoặc đã hủy',
      });
    }

    // Validate ghi chú
    if (note && note.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Ghi chú không được vượt quá 500 ký tự',
      });
    }

    const sanitizedNote = note
      ? sanitizeHtml(note, {
          allowedTags: ['b', 'i', 'em', 'strong'],
          allowedAttributes: {},
        })
      : undefined;

    const updateData = { updatedAt: new Date() };

    // Nếu có thay đổi timeslot
    if (timeslotId) {
      if (!mongoose.Types.ObjectId.isValid(timeslotId)) {
        return res.status(400).json({
          success: false,
          message: 'ID khung giờ không hợp lệ',
        });
      }

      const timeslot = await TimeSlot.findOne({ _id: timeslotId, status: 'active' }).session(session);
      if (!timeslot) {
        return res.status(404).json({
          success: false,
          message: 'Khung giờ không tồn tại hoặc không khả dụng',
        });
      }

      const currentTime = new Date();
      const timeslotDateTime = new Date(`${timeslot.date}T${timeslot.start_time}Z`);
      const eightHoursInMs = 8 * 60 * 60 * 1000;
      if (timeslotDateTime - currentTime < eightHoursInMs) {
        return res.status(400).json({
          success: false,
          message: 'Không thể chỉnh sửa lịch hẹn trong vòng 8 tiếng trước khi bắt đầu',
        });
      }

      // Kiểm tra trùng lịch
      const existingAppointment = await Appointment.findOne({
        timeslotId,
        _id: { $ne: appointmentId },
        status: { $ne: 'cancelled' },
      }).session(session);

      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Khung giờ này đã được đặt, vui lòng chọn khung giờ khác',
        });
      }

      // Nếu thay đổi timeslot thì cập nhật trạng thái slot cũ
      if (timeslotId !== appointment.timeslotId.toString()) {
        const oldTimeslot = await TimeSlot.findById(appointment.timeslotId).session(session);
        if (oldTimeslot) {
          oldTimeslot.isAvailable = true;
          await oldTimeslot.save();
        }

        timeslot.isAvailable = false;
        await timeslot.save();
        updateData.timeslotId = timeslotId;
      }
    }

    // Nếu có note hợp lệ thì cập nhật
    if (sanitizedNote !== undefined) {
      updateData.note = sanitizedNote;
    }

    // Nếu không có gì thay đổi
    if (!updateData.timeslotId && sanitizedNote === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ít nhất một thay đổi (khung giờ hoặc ghi chú)',
      });
    }

    // Tiến hành cập nhật
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true, runValidators: true, session }
    )
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

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: "Cập nhật lịch hẹn thành công",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Lỗi khi cập nhật lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật lịch hẹn",
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

    if (
      !mongoose.Types.ObjectId.isValid(patientId) ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "patientId hoặc ID lịch hẹn không hợp lệ",
      });
    }

    const appointment = await Appointment.findOne({ _id: id, patientId });
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn cho bệnh nhân này",
      });
    }

    // Nếu cập nhật timeslotId, kiểm tra và cập nhật trạng thái timeslot
    if (timeslotId && timeslotId !== appointment.timeslotId.toString()) {
      const newTimeslot = await TimeSlot.findById(timeslotId);
      if (!newTimeslot || !newTimeslot.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Khung giờ mới không tồn tại hoặc đã được đặt",
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
      .populate("patientId", "name")
      .populate("doctorId", "name")
      .populate("serviceId", "serviceName")
      .populate("clinicId", "name")
      .populate("timeslotId", "date start_time end_time");

    res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: "Cập nhật lịch hẹn thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật lịch hẹn theo patientId",
      error: error.message,
    });
  }
};

// Xóa lịch hẹn
const deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { refundAccount } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate(
      "userId"
    );

    if (!appointment) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Lịch hẹn đã bị hủy trước đó" });
    }

    const patient = appointment.userId;
    const payment = await Payment.findOne({ appointmentId: appointment._id });

    // Nếu có thanh toán, thực hiện thao tác hoàn tiền
    if (payment) {
      const timeslotId = payment.metaData?.timeslotId;

      if (timeslotId) {
        // Cập nhật lại timeslot là có thể đặt
        await TimeSlot.findByIdAndUpdate(timeslotId, {
          isAvailable: true,
        });
      }

      // Tạo bản ghi hoàn tiền
      await Refund.create({
        appointmentId: appointment._id,
        patientId: patient._id,
        amount: payment.amount,
        refundAccount,
        status: "pending",
      });
    } else {
      // Không tìm thấy thanh toán, vẫn cho hủy nhưng không hoàn tiền
      console.log("Không tìm thấy payment, chỉ hủy lịch.");
    }

    // Cập nhật trạng thái lịch hẹn
    appointment.status = "cancelled";
    appointment.refundAccount = refundAccount;
    await appointment.save();

    // Phản hồi thành công
    return res.status(200).json({
      success: true,
      message: "Hủy lịch hẹn thành công",
    });
  } catch (error) {
    console.error("Lỗi khi hủy lịch hẹn:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi hủy lịch hẹn",
    });
  }
};

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

    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ bệnh nhân của bạn",
      });
    }

    if (appointment.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền hủy lịch hẹn này",
        status: "ERROR",
      });
    }

    // Tìm payment để lấy timeslot
    const payment = await Payment.findOne({ appointmentId: appointment._id });
    if (payment && payment.metaData?.timeslotId) {
      await TimeSlot.findByIdAndUpdate(payment.metaData.timeslotId, {
        isAvailable: true,
      });
    }
    
    // Cập nhật trạng thái và STK
    appointment.status = "cancelled";
    appointment.refundAccount = refundAccount;
    await appointment.save();

    await Refund.create({
      appointmentId: appointment._id,
      patientId: patient._id,
      amount: payment.amount,
      refundAccount: refundAccount,
      status: "pending",
    });

    res.status(200).json({
      success: true,
      message: "Hủy lịch hẹn thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy lịch hẹn",
      error: error.message,
    });
    console.log(error);
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
