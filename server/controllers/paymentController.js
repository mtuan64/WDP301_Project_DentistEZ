const Payment = require("../models/Payment");
const Service = require("../models/Service");
const TimeSlot = require("../models/TimeSlot");
const Patient = require("../models/Patient");
const PayOS = require("@payos/node");
require("dotenv").config();

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);


// Tạo payment
const createPayment = async (req, res) => {
  try {
    const createdBy = req.user.userId;
    const patient = await Patient.findOne({ userId: createdBy });
    if (!patient)
      return res.status(404).json({ message: "Không tìm thấy bệnh nhân." });
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
    const timeslot = await TimeSlot.findById(timeslotId);
    if (!timeslot) {
      return res.status(404).json({ message: "Không tìm thấy timeslot." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotDate = new Date(timeslot.date);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate <= today) {
      return res.status(400).json({
        message:
          "Bạn phải đặt lịch trước ít nhất 1 ngày (không được đặt lịch cho hôm nay hoặc ngày đã qua).",
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ." });
    }
    const doctorId = service.doctorId;
    const clinicId = service.clinicId;


    // Tạo orderCode duy nhất
    
    const orderCode = Math.floor(Date.now() % 9007199254740991); // là number
    console.log("orderCode:", orderCode);

    


    const payload = {
      orderCode,
      amount,
      description: `Cọc ${description}`.slice(0, 25),
      returnUrl: "http://localhost:5173/payment-success",
      cancelUrl: "http://localhost:5173/payment-cancel",
      items: [
        { name: String(description || "Dịch vụ"), quantity: 1, price: amount },
      ],
    };
    console.log("Payload gửi PayOS:", payload);
    
    const response = await payos.createPaymentLink(payload);

    const payment = await Payment.create({
      amount,
      description,
      orderCode,
      payUrl: response.checkoutUrl,
      qrCode: response.qrCode, // Ensure QR code string is stored
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
      message: "Tạo thanh toán thành công. Vui lòng quét mã QR để thanh toán.",
      payment: {
        _id: payment._id,
        amount: payment.amount,
        description: payment.description,
        orderCode: payment.orderCode,
        qrCode: payment.qrCode,
        payUrl: payment.payUrl,
        status: payment.status,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Lỗi tạo thanh toán.", error: error.message });
  }
};

// Lấy payment theo id
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment)
      return res.status(404).json({ message: "Không tìm thấy payment." });
    return res.json(payment);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi truy vấn payment.", error: error.message });
  }
};

// Huỷ payment
const cancelPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment)
      return res.status(404).json({ message: "Không tìm thấy payment." });
    if (payment.status !== "pending")
      return res
        .status(400)
        .json({ message: "Không thể huỷ payment đã xử lý." });

    payment.status = "canceled";
    await payment.save();
    return res.json({ message: "Đã huỷ thanh toán.", payment });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi huỷ payment.", error: error.message });
  }
};

// Webhook để cập nhật trạng thái thanh toán
const handlePaymentWebhook = async (req, res) => {
  try {
    const { orderCode, status } = req.body;

    const payment = await Payment.findOne({ orderCode });
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy payment." });
    }

    // Cập nhật trạng thái thanh toán
    payment.status = status.toLowerCase(); // PayOS sends status like "PAID", "CANCELLED"
    await payment.save();

    return res.status(200).json({ message: "Cập nhật trạng thái thành công." });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Lỗi xử lý webhook.", error: error.message });
  }
};

// Lấy tất cả lịch sử giao dịch của bệnh nhân theo patientId
const getPaymentsByPatientId = async (req, res) => {
  try {
    const userId = req.user.userId;
    const patient = await Patient.findOne({ userId });
    if (!patient) {
      return res.status(404).json({ message: "Không tìm thấy bệnh nhân." });
    }

    const payments = await Payment.find({ "metaData.patientId": patient._id })
      .populate({
        path: "metaData.doctorId",
        populate: { path: "userId", select: "fullname" },
      })
      .populate("metaData.serviceId", "name")
      .populate("metaData.clinicId", "name")
      .populate("metaData.serviceOptionId", "name")
      .populate("metaData.timeslotId", "date startTime endTime")
      .sort({ createdAt: -1 });

    return res.json({
      message: "Lấy lịch sử giao dịch thành công.",
      payments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Lỗi khi lấy lịch sử giao dịch.",
      error: error.message,
    });
  }
};

// Lấy tất cả giao dịch cho nhân viên (staff)
const getAllPaymentsForStaff = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate({
        path: "metaData.patientId",
        populate: { path: "userId", select: "fullname" },
      })
      .populate({
        path: "metaData.doctorId",
        populate: { path: "userId", select: "fullname" },
      })
      .populate("metaData.serviceId", "name")
      .populate("metaData.clinicId", "name")
      .populate("metaData.serviceOptionId", "name")
      .populate("metaData.timeslotId", "date startTime endTime")
      .sort({ createdAt: -1 });

    return res.json({
      message: "Lấy tất cả giao dịch thành công.",
      payments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách giao dịch.",
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
  getPayment,
  cancelPayment,
  handlePaymentWebhook,
  getPaymentsByPatientId,
  getAllPaymentsForStaff
};

