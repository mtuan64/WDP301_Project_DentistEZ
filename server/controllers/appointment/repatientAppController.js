const Appointment = require("../../models/Appointment");
const TimeSlot = require("../../models/TimeSlot");
const dayjs = require('dayjs');
const mongoose = require("mongoose");


const createReExamination = async (req, res) => {
  try {
    const oldAppointmentId = req.params.id;
    const { serviceId, serviceOptionId, clinicId, timeslotId, note } = req.body;

    // 1. Lấy lịch khám gốc và kiểm tra trạng thái
    const oldAppointment = await Appointment.findById(oldAppointmentId);
    if (!oldAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch khám gốc'
      });
    }
    if (!["completed", "fully_paid"].includes(oldAppointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được tái khám cho lịch đã hoàn thành hoặc đã thanh toán đủ'
      });
    }

    // 2. Lấy bác sĩ từ lịch gốc
    const doctor = oldAppointment.doctorId;

    // 3. Tìm timeslot: đúng _id, đúng bác sĩ, còn trống
    const timeslot = await TimeSlot.findOne({
      _id: timeslotId,
      doctorId: doctor,
      isAvailable: true
    });
    if (!timeslot) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ không tồn tại, không thuộc bác sĩ này, hoặc đã được đặt'
      });
    }

    // 4. Kiểm tra ngày đã chọn phải >= hôm nay + 1
    const now = dayjs().startOf("day");
    const slotDate = dayjs(timeslot.date).startOf("day");
    if (slotDate.diff(now, "day") < 1) {
      return res.status(400).json({
        success: false,
        message: "Lịch tái khám phải đặt trước ít nhất 1 ngày"
      });
    }

    // 5. Chặn trùng ngày tái khám cho cùng lịch gốc
    const reExamList = await Appointment.find({
      reExaminationOf: oldAppointment._id
    }).populate({
      path: 'timeslotId',
      select: 'date'
    });
    const isDuplicated = reExamList.some(app => {
      if (!app.timeslotId || !app.timeslotId.date) return false;
      return dayjs(app.timeslotId.date).isSame(slotDate, 'day');
    });
    if (isDuplicated) {
      return res.status(400).json({
        success: false,
        message: "Bạn chỉ có thể đặt tối đa 1 lịch tái khám/ngày cho lịch gốc này."
      });
    }

    // 6. Tạo appointment tái khám mới
    const newAppointment = await Appointment.create({
      patientId: oldAppointment.patientId,
      doctorId: doctor,
      serviceId: serviceId || oldAppointment.serviceId,
      serviceOptionId: serviceOptionId || oldAppointment.serviceOptionId,
      clinicId: clinicId || oldAppointment.clinicId,
      timeslotId,
      note,
      createdBy: req.user?.id,
      reExaminationOf: oldAppointment._id,
      status: "confirmed"
    });

    // 7. Đánh dấu timeslot đã đặt
    timeslot.isAvailable = false;
    await timeslot.save();

    // 8. Trả về dữ liệu mới đã populate
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .populate('serviceId', 'serviceName')
      .populate('serviceOptionId', 'optionName price')
      .populate('clinicId', 'name')
      .populate('timeslotId', 'date start_time end_time');

    res.status(201).json({
      success: true,
      data: populatedAppointment,
      message: "Tạo lịch tái khám thành công"
    });

  } catch (error) {
    console.error('Error at createReExamination:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lịch tái khám',
      error: error.message
    });
  }
};
const populateOptions = [
  {
    path: "patientId",
    select: "userId",
    populate: {
      path: "userId",
      model: "User",
      select: "fullname email phone address dateOfBirth gender",
    }
  },
  {
    path: "doctorId",
    select: "userId",
    populate: {
      path: "userId",
      model: "User",
      select: "fullname",
    }
  },
  { path: "serviceId", select: "serviceName" },
  { path: "clinicId", select: "clinic_name" },
  { path: "timeslotId", select: "date start_time end_time" },
  { path: "serviceOptionId", select: "optionName price" }
];

const selectStr = "note doctorId patientId serviceId clinicId timeslotId serviceOptionId status createdAt";

const getReExaminationsByRoot = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    // Lấy lịch gốc (option: nếu bạn muốn show info ở đầu trang)
    const root = await Appointment.findById(id)
      .select(selectStr)
      .populate(populateOptions);

    if (!root) return res.status(404).json({ success: false, message: "Không tìm thấy lịch khám gốc" });

    // Lấy các lần tái khám của lịch gốc này
    const reExaminations = await Appointment.find({ reExaminationOf: id })
      .select(selectStr)
      .populate(populateOptions)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        root,
        reExaminations
      }
    });
  } catch (error) {
    console.error('Lỗi lấy lịch tái khám:', error);

    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch tái khám",
      error: error.message
    });
  }
};

module.exports = { createReExamination, getReExaminationsByRoot };
