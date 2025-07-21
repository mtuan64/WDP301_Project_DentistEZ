const mongoose = require("mongoose");
const TimeSlot = require("../models/TimeSlot");

// Lấy chi tiết timeslot theo ID
const getTimeslotById = async (req, res) => {
  try {
    const { timeslotId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(timeslotId)) {
      return res.status(400).json({
        success: false,
        message: "timeslotId không hợp lệ",
      });
    }

    const timeslot = await TimeSlot.findById(timeslotId).populate(
      "doctorId",
      "name"
    );
    if (!timeslot) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy timeslot",
      });
    }

    res.status(200).json({
      success: true,
      data: timeslot,
    });
  } catch (error) {
    console.error("Error fetching timeslot:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin timeslot",
      error: error.message,
    });
  }
};

// Lấy danh sách timeslot còn trống
const getAvailableTimeslots = async (req, res) => {
  try {
    const timeslots = await TimeSlot.find({
      isAvailable: true,
      status: "active",
    })
      .populate("doctorId", "name")
      .sort({ date: 1, start_time: 1 });

    res.status(200).json({
      success: true,
      data: timeslots,
    });
  } catch (error) {
    console.error("Error fetching available timeslots:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách timeslot còn trống",
      error: error.message,
    });
  }
};

// Tạo timeslot mới (dành cho bác sĩ )
const createTimeslot = async (req, res) => {
  try {
    const { doctorId, date, slot_index, start_time, end_time, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "doctorId không hợp lệ",
      });
    }

    const timeslot = new TimeSlot({
      doctorId,
      date,
      slot_index,
      start_time,
      end_time,
      note,
      isAvailable: true,
      status: "active",
    });

    await timeslot.save();

    res.status(201).json({
      success: true,
      message: "Tạo timeslot thành công",
      data: timeslot,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Timeslot đã tồn tại cho bác sĩ này vào thời điểm này",
      });
    }
    console.error("Error creating timeslot:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo timeslot",
      error: error.message,
    });
  }
};

// Cập nhật timeslot (ví dụ: hủy hoặc thay đổi trạng thái)
const updateTimeslot = async (req, res) => {
  try {
    const { timeslotId } = req.params;
    const { isAvailable, status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(timeslotId)) {
      return res.status(400).json({
        success: false,
        message: "timeslotId không hợp lệ",
      });
    }

    const timeslot = await TimeSlot.findById(timeslotId);
    if (!timeslot) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy timeslot",
      });
    }

    if (isAvailable !== undefined) timeslot.isAvailable = isAvailable;
    if (status) timeslot.status = status;
    if (note !== undefined) timeslot.note = note;

    await timeslot.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật timeslot thành công",
      data: timeslot,
    });
  } catch (error) {
    console.error("Error updating timeslot:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật timeslot",
      error: error.message,
    });
  }
};

// Xóa timeslot (chỉ xóa nếu chưa được đặt)
const deleteTimeslot = async (req, res) => {
  try {
    const { timeslotId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(timeslotId)) {
      return res.status(400).json({
        success: false,
        message: "timeslotId không hợp lệ",
      });
    }

    const timeslot = await TimeSlot.findById(timeslotId);
    if (!timeslot) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy timeslot",
      });
    }

    if (!timeslot.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa timeslot đã được đặt",
      });
    }

    await TimeSlot.deleteOne({ _id: timeslotId });

    res.status(200).json({
      success: true,
      message: "Xóa timeslot thành công",
    });
  } catch (error) {
    console.error("Error deleting timeslot:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa timeslot",
      error: error.message,
    });
  }
};
const getSlotByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;


    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "doctorId không hợp lệ",
      });
    }

    const timeslots = await TimeSlot.find({ doctorId })
      .populate("doctorId", "name")
      .sort({ date: 1, start_time: 1 });

    if (timeslots.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy timeslot cho bác sĩ này",
      });
    }

    res.status(200).json({
      success: true,
      data: timeslots,
    });
  } catch (error) {
    console.error("Error fetching timeslots by doctorId:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách timeslot của bác sĩ",
      error: error.message,
    });
  }
};

module.exports = {
  getTimeslotById,
  getAvailableTimeslots,
  createTimeslot,
  updateTimeslot,
  deleteTimeslot,
  getSlotByDoctorId,
};
