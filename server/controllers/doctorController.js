const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const TimeSlot = require('../models/TimeSlot');

exports.getAllDoctors = async (req, res) => {
  try {
    // Chỉ lấy doctor đã có chuyên ngành
    const doctors = await Doctor.find({ Specialty: { $exists: true, $ne: '' } })
      .populate('userId', 'fullname')
      .populate('clinic_id', 'name'); // Adjust 'name' to match your Clinic model field

    if (!doctors.length) {
      return res.status(200).json({
        success: true,
        message: 'No doctors found with a specialty.',
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error('Error in getAllDoctors:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format',
      });
    }

    // Tìm theo _id
    const doctor = await Doctor.findById(doctorId).populate('userId', 'fullname');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error('Error in getDoctorById:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.updateDoctorStatus = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const { Status } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format',
      });
    }

    // Kiểm tra trạng thái hợp lệ
    const normalizedStatus = Status?.toLowerCase();
    if (!['active', 'inactive'].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Only 'active' or 'inactive' are allowed.",
      });
    }

    // Tìm và cập nhật bác sĩ
    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { Status: normalizedStatus },
      { new: true, runValidators: true }
    ).populate('userId', 'fullname');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error('Error in updateDoctorStatus:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const { selected_slots, dates } = req.body;
    const userId = req.user?.userId;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or missing user information',
      });
    }

    // Tìm doctor dựa trên userId
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const doctorId = doctor._id;

    // Validate inputs
    if (!Array.isArray(selected_slots) || !selected_slots.length || !Array.isArray(dates) || !dates.length) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid slots and dates',
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

    // Validate selected_slots
    const validSlotIndices = defaultSlots.map((s) => s.slot_index);
    const invalidSlots = selected_slots.filter((s) => !validSlotIndices.includes(s));
    if (invalidSlots.length) {
      return res.status(400).json({
        success: false,
        message: `Invalid slot indices: ${invalidSlots.join(', ')}`,
      });
    }

    // Validate dates
    const invalidDates = dates.filter((dateStr) => !Date.parse(dateStr) || new Date(dateStr) < new Date());
    if (invalidDates.length) {
      return res.status(400).json({
        success: false,
        message: `Invalid or past dates: ${invalidDates.join(', ')}`,
      });
    }

    // Check existing slots in bulk
    const slotChecks = [];
    for (const dateStr of dates) {
      for (const slotIndex of selected_slots) {
        slotChecks.push({ doctorId, date: new Date(dateStr), slot_index: slotIndex });
      }
    }

    const existingSlots = await TimeSlot.find({
      $or: slotChecks,
    }).select('date slot_index');

    const existingSet = new Set(
      existingSlots.map((slot) => `${slot.date.toISOString().split('T')[0]}-${slot.slot_index}`)
    );

    const slots = [];
    for (const dateStr of dates) {
      for (const slotIndex of selected_slots) {
        const defaultSlot = defaultSlots.find((s) => s.slot_index === slotIndex);
        const dateKey = `${new Date(dateStr).toISOString().split('T')[0]}-${slotIndex}`;
        if (!existingSet.has(dateKey)) {
          slots.push({
            doctorId,
            date: new Date(dateStr),
            slot_index: slotIndex,
            start_time: defaultSlot.start_time,
            end_time: defaultSlot.end_time,
            isAvailable: true,
            status: 'active',
          });
        }
      }
    }

    if (slots.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All selected slots already exist. No new slots created.',
        created_count: 0,
      });
    }

    const result = await TimeSlot.insertMany(slots);

    return res.status(201).json({
      success: true,
      message: `Successfully created ${result.length} slot(s)!`,
      created_count: result.length,
    });
  } catch (error) {
    console.error('Error in createSchedule:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

exports.getScheduleByWeek = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { startDate, endDate } = req.query;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or missing user information',
      });
    }

    // Validate dates
    if (!startDate || !endDate || !Date.parse(startDate) || !Date.parse(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate or endDate format',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before endDate',
      });
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
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
    console.error('Error in getScheduleByWeek:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};