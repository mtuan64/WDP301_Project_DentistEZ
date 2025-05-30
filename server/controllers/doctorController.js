const Doctor = require("../models/Doctor");

exports.getAllDoctors = async (req, res, next) => {
  try {
     // Thêm .populate('userId', 'fullname') để lấy fullname từ User
     const doctors = await Doctor.find().populate('userId', 'fullname');

    res.status(200).json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error("Error in getAllDoctors:", error);
    next(error);
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

