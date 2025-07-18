

// Tạo payment
const Payment = require("../models/Payment");
const Service = require("../models/Service");
const TimeSlot = require("../models/TimeSlot");
const Patient = require("../models/Patient");
const PayOS = require("@payos/node");

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);


// Tạo payment
const createPayment = async (req, res) => {
  try {
    // Lấy userId từ middleware xác thực (giả sử đã gán vào req.user.id)
    const createdBy = req.user.userId;
    console.log("user id :", createdBy);


    // Tìm patientId theo userId
    const patient = await Patient.findOne({ userId: createdBy });
    if (!patient) return res.status(404).json({ message: "Không tìm thấy bệnh nhân." });
    const patientId = patient._id;

    const {
      amount, description,
      serviceId, serviceOptionId,
      timeslotId, note,
      fileUrl, fileName, fileType,reExaminationOf
    } = req.body;

    // Kiểm tra timeslotId hợp lệ
    if (!timeslotId) {
      return res.status(400).json({ message: "Thiếu timeslotId!" });
    }
    // Lấy timeslot từ DB
    const timeslot = await TimeSlot.findById(timeslotId);
    if (!timeslot) {
      return res.status(404).json({ message: "Không tìm thấy timeslot." });
    }

    // Kiểm tra ngày đặt lịch phải sau hôm nay ít nhất 1 ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slotDate = new Date(timeslot.date);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate <= today) {
      return res.status(400).json({
        message: "Bạn phải đặt lịch trước ít nhất 1 ngày (không được đặt lịch cho hôm nay hoặc ngày đã qua)."
      });
    }

    // Lấy thông tin dịch vụ để lấy doctorId, clinicId
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ." });
    }
    const doctorId = service.doctorId;
    const clinicId = service.clinicId;

    // Tạo orderCode duy nhất
    
    const orderCode = Math.floor(Date.now() % 9007199254740991); // là number
    console.log("orderCode:", orderCode);

    // Payload gửi PayOS
    const payload = {
      orderCode,
      amount,
      description: `Cọc ${description}`.slice(0, 25),
      returnUrl: "http://localhost:5173/payment-success",
      cancelUrl: "http://localhost:5173/payment-cancel",
      items: [{ name: String(description || "Dịch vụ"), quantity: 1, price: amount }]
    };
    console.log("Payload gửi PayOS:", payload);
    
    const response = await payos.createPaymentLink(payload);

    // Tạo bản ghi payment
    const payment = await Payment.create({
      amount,
      description,
      orderCode,
      payUrl: response.checkoutUrl,
      qrCode: response.qrCode,
      status: "pending",
      metaData: {
        patientId,
        doctorId,
        serviceId,
        serviceOptionId,
        clinicId,
        timeslotId,
        note,
        createdBy,
        fileUrl,
        fileName,
        fileType,
        reExaminationOf
      }
    });
    console.log("Payment created:", payment);
    console.log("orderCode từ callback:", orderCode);

    return res.status(201).json({
      message: "Tạo thanh toán thành công. Vui lòng thanh toán để xác nhận lịch.",
      payment
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi tạo thanh toán.", error: error.message });
  }
};

// Lấy payment theo id
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Không tìm thấy payment." });
    return res.json(payment);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi truy vấn payment.", error: error.message });
  }
};

// Huỷ payment
const cancelPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Không tìm thấy payment." });
    if (payment.status !== "pending") return res.status(400).json({ message: "Không thể huỷ payment đã xử lý." });

    payment.status = "canceled";
    await payment.save();
    return res.json({ message: "Đã huỷ thanh toán.", payment });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi huỷ payment.", error: error.message });
  }
};

module.exports = {
  createPayment,
  getPayment,
  cancelPayment,
  
};
