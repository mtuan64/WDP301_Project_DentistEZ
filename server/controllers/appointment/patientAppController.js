const Payment = require("../../models/Payment");
const TimeSlot = require("../../models/TimeSlot");
const Appointment = require("../../models/Appointment");
const AppointmentFile = require("../../models/AppointmentFile");

const payosCallback = async (req, res) => {
  try {
    console.log("PayOS callback body:", req.body);

    // Lấy dữ liệu từ callback
    const data = req.body.data || {};
    const orderCode = String(data.orderCode);
    const statusCode = data.code; // '00' là thành công
    const status = (statusCode === "00") ? "paid" : "failed";

    // Tìm Payment bằng orderCode (dùng chung cho cả deposit và final)
    const payment = await Payment.findOne({ orderCode });
    if (!payment) return res.status(200).json({ message: "Không tìm thấy payment" });

    // Nếu đã xử lý rồi thì bỏ qua
    if (payment.status === "paid") {
      return res.status(200).json({ message: "Payment đã xử lý trước đó" });
    }

    payment.status = status;
    await payment.save();

    // ========== PHÂN BIỆT DEPOSIT/final ==========
    if (status === "paid") {
      // 1. Nếu là thanh toán ĐẶT CỌC/ĐẶT LỊCH
      if (payment.type === "deposit") {
        const meta = payment.metaData;

        // Kiểm tra slot còn khả dụng
        const slot = await TimeSlot.findById(meta.timeslotId);
        if (!slot || slot.isAvailable === false) {
          return res.status(400).json({ message: "Slot đã được đặt hoặc không khả dụng." });
        }

        // Tạo appointment mới (đặt lịch)
        const appointment = await Appointment.create({
          patientId: meta.patientId,
          doctorId: meta.doctorId,
          serviceId: meta.serviceId,
          serviceOptionId: meta.serviceOptionId,
          clinicId: meta.clinicId,
          timeslotId: meta.timeslotId,
          note: meta.note,
          createdBy: meta.createdBy,
          status: "confirmed",
          reExaminationOf: meta.reExaminationOf || null
        });

        // Đánh dấu slot đã được đặt
        await TimeSlot.findByIdAndUpdate(meta.timeslotId, { isAvailable: false });

        // Lưu file (nếu có)
        const getFileType = (mimeType) => {
          if (!mimeType) return "other";
          const parts = mimeType.split("/");
          if (parts[1] === "vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
          if (parts[1] === "vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "xlsx";
          return parts[1] || "other";
        };
        if (meta.fileUrl) {
          await AppointmentFile.create({
            appointmentId: appointment._id,
            fileUrl: meta.fileUrl,
            fileName: meta.fileName || "",
            fileType: getFileType(meta.fileType),
          });
        }

        // Cập nhật appointmentId cho phiếu payment cọc
        payment.appointmentId = appointment._id;
        await payment.save();

        return res.status(201).json({
          message: "Đặt lịch thành công! Vui lòng xem chi tiết tại lịch của tôi",
          appointment,
          payment
        });
      }

      // 2. Nếu là thanh toán FINAL (70% còn lại)
      if (payment.type === "final" && payment.appointmentId) {
        // Update trạng thái lịch thành fully_paid
        await Appointment.findByIdAndUpdate(
          payment.appointmentId,
          { status: "fully_paid" }
        );
        return res.status(201).json({ message: "Đã cập nhật thanh toán đủ" });
      }

      // Trường hợp payment không đủ thông tin
      return res.status(200).json({ message: "Payment đã xử lý nhưng không xác định loại" });
    } else {
      // Trả lỗi nếu thanh toán không thành công
      payment.status = "canceled";
      await payment.save();
      return res.status(400).json({ message: "Thanh toán không thành công hoặc bị huỷ." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi xử lý callback.", error: error.message });
  }
};

module.exports = { payosCallback };
