const Doctor = require("../models/Doctor");
const TimeSlot = require("../models/TimeSlot");

exports.getAllDoctors = async (req, res) => {
  try {

    // Chỉ lấy doctor đã có chuyên ngành
    const doctors = await Doctor.find({Specialty: { $exists: true, $ne: '' }}).populate('userId').populate('clinic_id','clinic_name');


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

// POST /api/doctor/create-schedule
exports.createSchedule = async (req, res) => {
  try {
    const { selected_slots, dates } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin user!',
      });
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ!',
      });
    }

    const doctorId = doctor._id;

    if (!Array.isArray(selected_slots) || !Array.isArray(dates) || !selected_slots.length || !dates.length) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn slot và ngày!',
      });
    }

    if (!selected_slots.every(slot => typeof slot === 'number' && slot >= 1 && slot <= 9)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slot indices!',
      });
    }

    const defaultSlots = [
      { slot_index: 1, start_time: '08:00', end_time: '09:00' },
      { slot_index: 2, start_time: '09:00', end_time: '10:00' },
      { slot_index: 3, start_time: '10:00', end_time: '11:00' },
      { slot_index: 4, start_time: '14:00', end_time: '15:00' },
      { slot_index: 5, start_time: '15:00', end_time: '16:00' },
      { slot_index: 6, start_time: '16:00', end_time: '17:00' },
      { slot_index: 7, start_time: '17:00', end_time: '18:00' },
      { slot_index: 8, start_time: '18:00', end_time: '19:00' },
      { slot_index: 9, start_time: '19:00', end_time: '20:00' },
    ];

    const slots = [];

    for (const dateStr of dates) {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: `Invalid date: ${dateStr}`,
        });
      }

      for (const slotIndex of selected_slots) {
        const defaultSlot = defaultSlots.find(s => s.slot_index === slotIndex);
        if (defaultSlot) {
          const exists = await TimeSlot.exists({ doctorId, date, slot_index: slotIndex });
          if (!exists) {
            slots.push({
              doctorId,
              date,
              slot_index: slotIndex,
              start_time: defaultSlot.start_time,
              end_time: defaultSlot.end_time,
              isAvailable: true,
              status: 'active',
            });
          }
        }
      }
    }

    if (slots.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Tất cả các slot đã tồn tại. Không có slot mới được tạo.',
        created_count: 0,
      });
    }

    const result = await TimeSlot.insertMany(slots);

    return res.status(201).json({
      success: true,
      message: `Tạo thành công ${result.length} slot!`,
      created_count: result.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server!',
      error: error.message,
    });
  }
};

// GET /api/doctor/getScheduleByWeek
exports.getScheduleByWeek = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate or endDate!',
      });
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ!',
      });
    }

    const slots = await TimeSlot.find({
      doctorId: doctor._id,
      date: {
        $gte: start,
        $lte: end,
      },
    }).sort({ date: 1, slot_index: 1 });

    return res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server!',
      error: error.message,
    });
  }
};