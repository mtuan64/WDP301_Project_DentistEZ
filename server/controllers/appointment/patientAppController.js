const Payment = require("../../models/Payment");
const TimeSlot = require("../../models/TimeSlot");
const Appointment = require("../../models/Appointment");
const AppointmentFile = require("../../models/AppointmentFile");
const User = require("../../models/User");
const Patient = require("../../models/Patient");
const Doctor = require("../../models/Doctor");
const Service = require("../../models/Service");
const ServiceOption = require("../../models/ServiceOption");
const Clinic = require("../../models/Clinic");
const sendEmail = require("../../utils/emailService");

console.log("Callback route đã nhận request");

const payosCallback = async (req, res) => {
  console.log("PayOS callback body:", req.body);

  try {
    const data = req.body.data || {};
    const orderCode = String(data.orderCode);
    const statusCode = data.code;
    const status = statusCode === "00" ? "paid" : "failed";

    const payment = await Payment.findOne({ orderCode });
    console.log("payment tìm được:", payment);

    if (!payment) {
      return res.status(200).json({ message: "Webhook test OK" });
    }

    if (payment.status === "paid") {
      return res.status(200).json({ message: "Payment đã xử lý trước đó" });
    }

    if (status === "paid" && payment.status !== "paid") {
      const meta = payment.metaData;

      // ===== 1. THANH TOÁN ĐẶT CỌC ("deposit") =====
      if (payment.type === "deposit") {
        // Kiểm tra slot còn khả dụng
        const slot = await TimeSlot.findById(meta.timeslotId);
        if (!slot || slot.isAvailable === false) {
          return res.status(400).json({ message: "Slot đã được đặt hoặc không khả dụng." });
        }

        // Tạo appointment mới
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
          reExaminationOf: meta.reExaminationOf || null,
        });

        await TimeSlot.findByIdAndUpdate(meta.timeslotId, { isAvailable: false });

        // File kèm theo
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

        payment.status = "paid";
        payment.appointmentId = appointment._id;
        await payment.save();

        const [doctor, service, serviceOption, clinic, slotInfo, user] = await Promise.all([
          Doctor.findById(meta.doctorId),
          Service.findById(meta.serviceId),
          ServiceOption.findById(meta.serviceOptionId),
          Clinic.findById(meta.clinicId),
          TimeSlot.findById(meta.timeslotId),
          User.findById(meta.createdBy),
        ]);
        // Join User của doctor nếu muốn chuẩn hóa tên
        const doctorUser = doctor ? await User.findById(doctor.userId) : null;
        const doctorName = doctorUser?.fullname || doctorUser?.username || doctor?.fullName || "Không xác định";

        const getStartDateTime = (date, timeStr) => {
          if (!date || !timeStr) return null;
          const [hours, minutes] = timeStr.split(":").map(Number);
          const dateObj = new Date(date);
          dateObj.setHours(hours, minutes, 0, 0);
          return dateObj;
        };

        const startDateTime = getStartDateTime(slotInfo.date, slotInfo.start_time);
        const appointmentDate = startDateTime ? startDateTime.toLocaleDateString("vi-VN") : "Không xác định";
        const appointmentTime = startDateTime ? startDateTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Không xác định";

        if (user && user.email) {
          const emailSubject = "Xác nhận lịch hẹn thành công";
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
              <h2 style="color: #2E86C1;">🎉 Đặt lịch khám thành công!</h2>
              <p>Chào <strong>${user.username}</strong>,</p>
              <p>Chúng tôi đã ghi nhận thanh toán thành công của bạn. Dưới đây là thông tin chi tiết:</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr><td style="padding: 8px;">🧑‍⚕️ Bác sĩ:</td><td style="padding: 8px;">${doctorName}</td></tr>
                <tr><td style="padding: 8px;">📄 Dịch vụ:</td><td style="padding: 8px;">${service?.serviceName || "Không xác định"}</td></tr>
                <tr><td style="padding: 8px;">🔖 Gói dịch vụ:</td><td style="padding: 8px;">${serviceOption?.optionName || "Không xác định"}</td></tr>
                <tr><td style="padding: 8px;">🏥 Phòng khám:</td><td style="padding: 8px;">${clinic?.clinic_name || "Không xác định"}</td></tr>
                <tr><td style="padding: 8px;">📅 Thời gian:</td><td style="padding: 8px;">${appointmentDate} lúc ${appointmentTime}</td></tr>
                <tr><td style="padding: 8px;">💵 Số tiền đã đặt cọc:</td><td style="padding: 8px;">${payment.amount.toLocaleString()} VND</td></tr>
                <tr><td style="padding: 8px;">🧾 Mã đơn hàng:</td><td style="padding: 8px;">${payment.orderCode}</td></tr>
                <tr><td style="padding: 8px;">📝 Ghi chú:</td><td style="padding: 8px;">${meta.note || "Không có"}</td></tr>
              </table>
              <p style="margin-top: 20px;">Bạn có thể xem lịch sử đặt khám trong mục <strong>"Lịch của tôi"</strong> tại hệ thống DentistEZ.</p>
              <p style="color: #888; font-size: 12px;">Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi.</p>
            </div>
          `;
          await sendEmail(user.email, emailSubject, "", emailHtml);
        }

        return res.status(201).json({
          message: "Đặt lịch thành công! Vui lòng xem chi tiết tại lịch của tôi",
          appointment,
          payment,
        });
      }

      // ===== 2. THANH TOÁN FINAL (PHẦN CÒN LẠI) =====
      if (payment.type === "final" && payment.appointmentId) {
        const updatedAppointment = await Appointment.findByIdAndUpdate(
          payment.appointmentId,
          { status: "fully_paid" },
          { new: true }
        );
        payment.status = "paid";
        await payment.save();

        // Lấy đầy đủ info: patient (User), doctor (User), v.v.
        const [
          patient,
          doctor,
          service,
          serviceOption,
          clinic,
          timeslot
        ] = await Promise.all([
          Patient.findById(updatedAppointment.patientId),
          Doctor.findById(updatedAppointment.doctorId),
          Service.findById(updatedAppointment.serviceId),
          ServiceOption.findById(updatedAppointment.serviceOptionId),
          Clinic.findById(updatedAppointment.clinicId),
          TimeSlot.findById(updatedAppointment.timeslotId),
        ]);
        const user = patient ? await User.findById(patient.userId) : null;
        const doctorUser = doctor ? await User.findById(doctor.userId) : null;
        const doctorName = doctorUser?.fullname || doctorUser?.username || doctor?.fullName || "Không xác định";

        const getStartDateTime = (date, timeStr) => {
          if (!date || !timeStr) return null;
          const [hours, minutes] = timeStr.split(":").map(Number);
          const dateObj = new Date(date);
          dateObj.setHours(hours, minutes, 0, 0);
          return dateObj;
        };
        const startDateTime = getStartDateTime(timeslot.date, timeslot.start_time);
        const appointmentDate = startDateTime ? startDateTime.toLocaleDateString("vi-VN") : "Không xác định";
        const appointmentTime = startDateTime ? startDateTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Không xác định";

        if (user && user.email) {
          const emailSubject = "Xác nhận thanh toán đủ lịch khám";
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
              <h2 style="color: #2E86C1;">🎉 Bạn đã  hoàn tất thanh toán !</h2>
              <p>Chào <strong>${user.username || user.fullname || ""}</strong>,</p>
              <p>Chúng tôi xác nhận bạn đã thanh toán đầy đủ cho lịch hẹn. Thông tin như sau:</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr><td style="padding: 8px;">🧑‍⚕️ Bác sĩ:</td><td style="padding: 8px;">${doctorName}</td></tr>
                <tr><td style="padding: 8px;">📄 Dịch vụ:</td><td style="padding: 8px;">${service?.serviceName || "Không xác định"}</td></tr>
                <tr><td style="padding: 8px;">🔖 Gói dịch vụ:</td><td style="padding: 8px;">${serviceOption?.optionName || "Không xác định"}</td></tr>
                <tr><td style="padding: 8px;">🏥 Phòng khám:</td><td style="padding: 8px;">${clinic?.clinic_name || "Không xác định"}</td></tr>
                <tr><td style="padding: 8px;">📅 Thời gian:</td><td style="padding: 8px;">${appointmentDate} lúc ${appointmentTime}</td></tr>
                <tr><td style="padding: 8px;">💵 Đã thanh toán đủ</td><td style="padding: 8px;">-</td></tr>
                <tr><td style="padding: 8px;">🧾 Mã đơn hàng:</td><td style="padding: 8px;">${payment.orderCode}</td></tr>
                <tr><td style="padding: 8px;">📝 Ghi chú:</td><td style="padding: 8px;">${updatedAppointment.note || "Không có"}</td></tr>
              </table>
              <p style="margin-top: 20px;">Bạn có thể xem chi tiết lịch hẹn trong mục <strong>“Lịch của tôi”</strong>.</p>
              <p style="color: #888; font-size: 12px;">Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi.</p>
            </div>
          `;
          await sendEmail(user.email, emailSubject, "", emailHtml);
        }

        return res.status(201).json({
          message: "Đã cập nhật thanh toán đủ, đã gửi email xác nhận.",
          payment,
          appointment: updatedAppointment,
        });
      }

      return res.status(200).json({ message: "Payment đã xử lý nhưng không xác định loại" });
    } else {
      payment.status = "canceled";
      await payment.save();
      return res.status(200).json({ message: "Thanh toán không thành công hoặc bị huỷ." });
    }
  } catch (error) {
    console.error(" Callback xử lý lỗi:", error);
    return res.status(500).json({
      message: "Lỗi xử lý callback.",
      error: error.message,
    });
  }
};

module.exports = { payosCallback };
