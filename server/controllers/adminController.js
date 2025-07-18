const bcrypt = require("bcrypt");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Clinic = require("../models/Clinic");
const Staff = require("../models/Staff");
const Patient = require("../models/Patient");
const mongoose = require("mongoose");
const Service = require("../models/Service");
const ServiceOption = require("../models/ServiceOption");
const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;
const path = require("path");


const uploadDir = path.join(__dirname, "../uploads");
fs.mkdir(uploadDir, { recursive: true }).catch((err) =>
  console.error("Error creating uploads directory:", err)
);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createAcountDoctor = async (req, res) => {
  const session = await mongoose.startSession();// tạo session
  session.startTransaction();
  try {
    const { email, password, fullname, clinic_id } = req.body;

    // 1. Kiểm tra 
    if (!mongoose.Types.ObjectId.isValid(clinic_id)) {
      throw new Error('clinic_id không hợp lệ');
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email đã được đăng ký');

    const existingDoctorWithClinic = await Doctor.findOne({ clinic_id });
    if (existingDoctorWithClinic) {
      throw new Error('Phòng này đã được sử dụng bởi bác sĩ khác');
    }

    // 2. Tạo user
    const newUser = new User({
      username: '',
      fullname,
      email,
      password: await bcrypt.hash(password, 10),
      role: "doctor",
      phone: '',
      address: '',
      dateOfBirth: '',
      gender: ''
    });
    const savedUser = await newUser.save({ session });

    // 3. Tạo doctor
    const doctor = new Doctor({
      userId: savedUser._id,
      clinic_id: clinic_id,
      Specialty: '',
      Degree: '',
      ExperienceYears: 0,
      Description: '',
      Status: 'active',
      ProfileImage: ''
    });
    const savedDoctor = await doctor.save({ session });

    await session.commitTransaction();// lưu tất cả nếu thành công .
    session.endSession();

    res.status(200).json({
      success: true,
      user: savedUser,
      doctor: savedDoctor,

    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
const getAllClinic = async (req, res) => {
  try {
    const clinics = await Clinic.find();
    res.status(200).json({
      success: true,
      data: clinics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const createAcountStaff = async (req, res) => {
  const session = await mongoose.startSession();// tạo session
  session.startTransaction();
  try {
    const { email, password, fullname } = req.body;

    // 1. Kiểm tra 

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email đã được đăng ký');

    // 2. Tạo user
    const newUser = new User({
      username: '',
      fullname,
      email,
      password: await bcrypt.hash(password, 10),
      role: "staff",
      phone: '',
      address: '',
      dateOfBirth: '',
      gender: '',
      profilePicture: ''
    });
    const savedUser = await newUser.save({ session });

    // 3. Tạo staff
    const staff = new Staff({
      userId: savedUser._id,
      Status: 'active',

    });
    const savedStaff = await staff.save({ session });

    await session.commitTransaction();// lưu tất cả nếu thành công .
    session.endSession();

    res.status(200).json({
      success: true,
      user: savedUser,
      doctor: savedStaff,

    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getAllPatient = async (req, res) => {
  try {
    const patients = await Patient.find().populate('userId');
    res.status(200).json({
      success: true,
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const getAllDoctor = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId').populate('clinic_id', 'clinic_name');

    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
const getAllStaff = async (req, res) => {
  try {
    const staffs = await Staff.find().populate('userId');
    res.status(200).json({
      success: true,
      data: staffs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const changeStatus = async (req, res) => {
  try {
    const { role, recordId } = req.params;// recordID là id trong bảng patiens 
    const { Status } = req.body;

    // Validate status
    if (!Status || !['active', 'inactive'].includes(Status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "active" or "inactive"'
      });
    }

    let updatedRecord = null;
    let Model = null;

    // Xác định model dựa trên role
    switch (role.toLowerCase()) {
      case 'doctor':
        Model = Doctor;
        break;
      case 'staff':
        Model = Staff;
        break;
      case 'patient':
        Model = Patient;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be doctor, staff, or patient'
        });
    }

    // Cập nhật status
    updatedRecord = await Model.findByIdAndUpdate(
      recordId,
      { Status: Status },
      { new: true }
    ).populate('userId', 'fullname email username phone address role');

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: `${role} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `${role} status updated to ${Status}`,
      data: updatedRecord
    });

  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getAllService = async (req, res) => {
  try {
    const services = await Service.find().populate({
      path: 'doctorId',
      populate: {
        path: 'userId',
        select: 'fullname email'
      }
    }).populate('clinicId', 'clinic_name');

    // Lọc chỉ các service mà doctor.status == "active"
    const activeServices = services.filter(sv =>
      sv.doctorId && sv.doctorId.Status === 'active'
    );

    // Nếu muốn trả kèm options nhỏ cho từng service:
    const servicesWithOptions = await Promise.all(
      activeServices.map(async (sv) => {
        const options = await ServiceOption.find({ serviceId: sv._id });
        return { ...sv.toObject(), options };
      })
    );
    res.status(200).json({
      success: true,
      data: servicesWithOptions,

    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const getAllServicebyManager = async (req, res) => {
  try {
    const services = await Service.find()
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'fullname email'
        }
      })
      .populate('clinicId', 'clinic_name');

    // Trả về ALL service, k phân biệt doctor status
    const servicesWithOptions = await Promise.all(
      services.map(async (sv) => {
        const options = await ServiceOption.find({ serviceId: sv._id });
        return { ...sv.toObject(), options };
      })
    );
    res.status(200).json({
      success: true,
      data: servicesWithOptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const createService = async (req, res) => {
  try {
    const { serviceName, doctorId, description, image, options } = req.body;

    // Validate đầu vào cơ bản
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "id bác sĩ không hợp lệ" });
    }
    if (!serviceName || !doctorId || !description || !image) {
      return res.status(400).json({ message: "Thiếu trường bắt buộc" });
    }
    if (!Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Phải có ít nhất 1 option dịch vụ nhỏ'
      });
    }
    // Tìm bác sĩ và lấy clinicId từ bác sĩ
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(400).json({ message: "Bác sĩ không tồn tại" });
    }
    if (doctor.Status !== 'active') {
      return res.status(400).json({ message: "Bác sĩ này đã bị khóa tài khoản" });
    }
    const clinicId = doctor.clinic_id; // lấy từ DB, không lấy từ client

    // Kiểm tra mỗi bác sĩ chỉ có 1 service
    const existedService = await Service.findOne({ doctorId });
    if (existedService) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ này đã có dịch vụ. Mỗi bác sĩ chỉ được tạo 1 dịch vụ!'
      });
    }

    

    // Kiểm tra từng option nhỏ
    for (const opt of options) {
      if (!opt.optionName || !opt.price || !opt.image) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin option dịch vụ nhỏ'
        });
      }
    }

    // Tạo service tổng
    const service = await Service.create({
      serviceName,
      clinicId,
      doctorId,
      description,
      image
    });

    // Tạo các service option nhỏ
    const optionDocs = [];
    for (const opt of options) {
      const optionDoc = await ServiceOption.create({
        serviceId: service._id,
        optionName: opt.optionName,
        price: opt.price,
        image: opt.image
      });
      optionDocs.push(optionDoc);
    }

    res.status(201).json({ message: 'Tạo dịch vụ thành công', service, options: optionDocs });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


const uploadImageCloudinary = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "service_images",
      resource_type: "image"
    });
    await fs.unlink(file.path);
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload image to Cloudinary",
      error: error.message,
    });
  }
};
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }


    const serviceop = await ServiceOption.deleteMany({ serviceId: id });
    if (!serviceop) {
      return res.status(404).json({ message: "dịch vị không tồn tại " });
    }

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.status(200).json({
      success: true,
      message: "Xóa dịch vụ thành công"
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to delete service",
      error: error.message,
    });
  }
}
const editService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceName, doctorId, description, image, options } = req.body;

    if (req.file) {
      // Upload lên Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "service_images",
        resource_type: "image"
      });
      image = result.secure_url;
      await fs.unlink(req.file.path); // Xóa file local
    }

    // Tìm service hiện tại
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Dịch vụ không tồn tại" });
    }

    // Nếu đổi sang bác sĩ khác
    if (doctorId && doctorId !== service.doctorId.toString()) {
      // Kiểm tra bác sĩ mới đã có dịch vụ nào khác chưa
      const existedService = await Service.findOne({ doctorId, _id: { $ne: id } });//not equal
      if (existedService) {
        return res.status(400).json({
          success: false,
          message: 'Bác sĩ này đã có dịch vụ khác. Không thể chuyển sang!'
        });
      }

      // Lấy clinicId mới từ bác sĩ mới
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(400).json({ message: "Bác sĩ không tồn tại" });
      }
      service.clinicId = doctor.clinic_id;
    }

    // Cập nhật service chính
    service.serviceName = serviceName;
    service.doctorId = doctorId;
    service.description = description;
    service.image = image;
    await service.save();

    // Xử lý option nhỏ (chuẩn CRUD từng option)
    const oldOptions = await ServiceOption.find({ serviceId: id });
    const oldOptionIds = oldOptions.map(opt => opt._id.toString());
    const newOptionIds = options.filter(opt => opt._id).map(opt => opt._id);

    // Xóa option đã bị xóa ở FE
    for (const oldId of oldOptionIds) {
      if (!newOptionIds.includes(oldId)) {
        await ServiceOption.findByIdAndDelete(oldId);
      }
    }

    // Cập nhật hoặc tạo mới option
    const optionDocs = [];
    for (const opt of options) {
      if (opt._id) {
        // Update option cũ
        const updated = await ServiceOption.findByIdAndUpdate(opt._id, {
          optionName: opt.optionName,
          price: opt.price,
          image: opt.image
        }, { new: true });
        optionDocs.push(updated);
      } else {
        // Tạo mới option
        const created = await ServiceOption.create({
          serviceId: id,
          optionName: opt.optionName,
          price: opt.price,
          image: opt.image
        });
        optionDocs.push(created);
      }
    }

    res.json({ success: true, message: 'Đã cập nhật dịch vụ!', service, options: optionDocs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Sửa dịch vụ thất bại!', error: error.message });
  }
};



module.exports = {
  createAcountDoctor,
  getAllClinic,
  createAcountStaff,
  getAllPatient,
  getAllDoctor,
  getAllStaff,
  changeStatus,
  getAllService,
  createService,
  uploadImageCloudinary,
  deleteService,
  editService,
  getAllServicebyManager,



}