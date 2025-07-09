
const Payment = require("../../models/Payment");
const TimeSlot = require("../../models/TimeSlot");
const Appointment = require("../../models/Appointment");
const AppointmentFile = require("../../models/AppointmentFile");

const payosCallback = async (req, res) => {
  try {
    const { orderCode, status } = req.body;
    const payment = await Payment.findOne({ orderCode });

    if (!payment) return res.status(404).json({ message: "Không tìm thấy payment." });

    if (status === "PAID" && payment.status !== "paid") {
      const meta = payment.metaData;

      // Kiểm tra slot còn khả dụng không
      const slot = await TimeSlot.findById(meta.timeslotId);
      if (!slot || slot.isAvailable === false) {
        return res.status(400).json({ message: "Slot đã được đặt hoặc không khả dụng." });
      }

      // Tạo appointment với trạng thái confirmed
      const appointment = await Appointment.create({
        patientId: meta.patientId,
        doctorId: meta.doctorId,
        serviceId: meta.serviceId,
        serviceOptionId: meta.serviceOptionId,
        clinicId: meta.clinicId,
        timeslotId: meta.timeslotId,
        note: meta.note,
        createdBy: meta.createdBy,
        status: "confirmed"
      });

      // Đánh dấu slot đã được đặt
      await TimeSlot.findByIdAndUpdate(meta.timeslotId, { isAvailable: false });

      // Lấy đuôi file từ mime-type
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
      console.log("meta trong callback:", meta);

      payment.status = "paid";
      payment.appointmentId = appointment._id;
      await payment.save();

      return res.status(201).json({
        message: "Đặt lịch thành công! Vui lòng xem chi tiết tại lịch của tôi ",
        appointment,
        payment
      });
    } else {
      return res.status(400).json({ message: "Thanh toán chưa thành công hoặc đã xử lý." });
    }
  } catch (error) {
    return res.status(500).json({ message: "Lỗi xử lý callback.", error: error.message });
  }
};

module.exports = { payosCallback };