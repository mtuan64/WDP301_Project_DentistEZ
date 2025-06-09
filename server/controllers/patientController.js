const Patient = require("../models/Patient");

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate("userId", "fullname email address dateOfBirth gender phone").exec();
    res.status(200).json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error("Error in getAllStaffs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};