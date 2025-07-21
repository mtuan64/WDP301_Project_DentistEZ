const Payment = require("../../models/Payment");
const TimeSlot = require("../../models/TimeSlot");
const Appointment = require("../../models/Appointment");
const AppointmentFile = require("../../models/AppointmentFile");
const User = require("../../models/User");
const Doctor = require("../../models/Doctor");
const Service = require("../../models/Service");
const ServiceOption = require("../../models/ServiceOption");
const Clinic = require("../../models/Clinic");
const sendEmail = require("../../utils/emailService");
console.log("Callback route đã nhận request");

const payosCallback = async (req, res) => {
  console.log("PayOS callback body:", req.body);

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

      const [doctor, service, serviceOption, clinic, timeslot] =
        await Promise.all([
          Doctor.findById(meta.doctorId),
          Service.findById(meta.serviceId),
          ServiceOption.findById(meta.serviceOptionId),
          Clinic.findById(meta.clinicId),
          TimeSlot.findById(meta.timeslotId),
        ]);
      const getStartDateTime = (date, timeStr) => {
        if (!date || !timeStr) return null;
        const [hours, minutes] = timeStr.split(":").map(Number);
        const dateObj = new Date(date);
        dateObj.setHours(hours, minutes, 0, 0);
        return dateObj;
      };

      const startDateTime = getStartDateTime(
        timeslot.date,
        timeslot.start_time
      );

      const appointmentDate = startDateTime
        ? startDateTime.toLocaleDateString("vi-VN")
        : "Không xác định";

      const appointmentTime = startDateTime
        ? startDateTime.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Không xác định";

      const user = await User.findById(meta.createdBy);
      if (user && user.email) {
        const emailSubject = "Xác nhận lịch hẹn thành công";
        const emailHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
    <h2 style="color: #2E86C1;">🎉 Đặt lịch khám thành công!</h2>
    <p>Chào <strong>${user.username}</strong>,</p>
    <p>Chúng tôi đã ghi nhận thanh toán thành công của bạn. Dưới đây là thông tin chi tiết:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr><td style="padding: 8px;">📄 Dịch vụ:</td><td style="padding: 8px;">${
        service?.serviceName || "Không xác định"
      }</td></tr>
      <tr><td style="padding: 8px;">🔖 Gói dịch vụ:</td><td style="padding: 8px;">${
        serviceOption?.optionName || "Không xác định"
      }</td></tr>
      <tr><td style="padding: 8px;">🏥 Phòng khám:</td><td style="padding: 8px;">${
        clinic?.clinic_name || "Không xác định"
      }</td></tr>
      <tr><td style="padding: 8px;">📅 Thời gian:</td><td style="padding: 8px;">${appointmentDate} lúc ${appointmentTime}</td></tr>
      <tr><td style="padding: 8px;">💵 Số tiền:</td><td style="padding: 8px;">${payment.amount.toLocaleString()} VND</td></tr>
      <tr><td style="padding: 8px;">🧾 Mã đơn hàng:</td><td style="padding: 8px;">${
        payment.orderCode
      }</td></tr>
      <tr><td style="padding: 8px;">📝 Ghi chú:</td><td style="padding: 8px;">${
        meta.note || "Không có"
      }</td></tr>
    </table>

    <p style="margin-top: 20px;">Bạn có thể xem lịch sử đặt khám trong mục <strong>"Lịch của tôi"</strong> tại hệ thống DentistEZ.</p>
    <p style="color: #888; font-size: 12px;">Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi.</p>
  </div>
  `;
        console.log("doctor:", doctor);
        console.log("service:", service);
        console.log("serviceOption:", serviceOption);
        console.log("clinic:", clinic);
        console.log("timeslot:", timeslot);
        console.log("timeslot.startTime:", timeslot?.startTime);

        await sendEmail(user.email, emailSubject, "", emailHtml);
      }
      return res.status(201).json({
        message: "Đặt lịch thành công! Vui lòng xem chi tiết tại lịch của tôi",
        appointment,
        payment,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Thanh toán chưa thành công hoặc đã xử lý." });
    }
  } catch (error) {
    console.error("❌ Callback xử lý lỗi:", error);
    return res.status(500).json({
      message: "Lỗi xử lý callback.",
      error: error.message,
    });
  }
};

module.exports = { payosCallback };
