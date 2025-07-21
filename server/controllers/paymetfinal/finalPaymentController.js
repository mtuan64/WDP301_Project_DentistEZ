// controllers/payment.js

const Payment = require("../../models/Payment");
const Appointment = require("../../models/Appointment");
const PayOS = require("@payos/node");
const mongoose = require("mongoose");
require("dotenv").config();

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

// Thanh toán 70% ONLINE cho lịch (POST /payments/:appointmentId/final/online)
const createFinalOnlinePayment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { amount, description } = req.body; // amount = 70% giá

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        if (appointment.reExaminationOf)
            return res.status(400).json({ message: "Lịch tái khám miễn phí, không cần thanh toán!" });
        if (appointment.status === "fully_paid")
            return res.status(400).json({ message: "Lịch đã thanh toán đủ!" });

        // Tạo orderCode duy nhất
        const orderCode = Math.floor(Date.now() % 9007199254740991);
        const payload = {
            orderCode,
            amount,
            description: `Thanh toán 70% - ${description}`.slice(0, 25),
            returnUrl: "http://localhost:5173/staffmanager/payment-success",
            cancelUrl: "http://localhost:5173/staffmanager/payment-cancel",
            items: [{ name: description , quantity: 1, price: amount }],
        };
        const response = await payos.createPaymentLink(payload);

        // Lưu phiếu payment final
        const payment = await Payment.create({
            amount,
            description,
            orderCode,
            payUrl: response.checkoutUrl,
            qrCode: response.qrCode,
            status: "pending",
            type: "final",
            paymentMethod: "online",
            appointmentId
        });

        res.status(201).json({
            message: "Tạo liên kết thanh toán 70% thành công.",
            payment,
        });
    } catch (err) {
        console.error("Lỗi tạo final payment:", err);
        res.status(500).json({ message: "Lỗi tạo final payment.", error: err.message });
    }
};

// Thanh toán 70% TIỀN MẶT cho lịch (POST /payments/:appointmentId/final/cash)
const createFinalCashPayment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { amount, description } = req.body;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        if (appointment.reExaminationOf)
            return res.status(400).json({ message: "Lịch tái khám miễn phí, không cần thanh toán!" });
        if (appointment.status === "fully_paid")
            return res.status(400).json({ message: "Lịch đã thanh toán đủ!" });

        const payment = await Payment.create({
            amount,
            description,
            orderCode: Math.floor(Date.now() % 9007199254740991), 
            status: "paid",
            type: "final",
            paymentMethod: "cash",
            appointmentId
        });

        appointment.status = "fully_paid";
        await appointment.save();

        res.status(201).json({
            message: "Đã ghi nhận thanh toán tiền mặt 70% thành công.",
            payment,
        });
    } catch (err) {
        console.error("Lỗi thanh toán tiền mặt:", err);
        res.status(500).json({ message: "Lỗi thanh toán tiền mặt.", error: err.message });
    }
};
const payosCallbackFinal = async (req, res) => {
    try {
        const data = req.body.data || {};
        const orderCode = String(data.orderCode);
        const statusCode = data.code; // "00" là thành công

        // Đổi status
        const status = (statusCode === "00") ? "paid" : "failed";

        const payment = await Payment.findOne({ orderCode });

        if (!payment) {
            return res.status(200).json({ message: "Không tìm thấy payment" });
        }
        if (payment.status === "paid") {
            return res.status(200).json({ message: "Đã xử lý payment này trước đó" });
        }

        if (status === "paid") {
            payment.status = "paid";
            await payment.save();

            // Nếu là thanh toán "final" (70%) thì cập nhật luôn appointment
            if (payment.type === "final" && payment.appointmentId) {
                await Appointment.findByIdAndUpdate(
                    payment.appointmentId,
                    { status: "fully_paid" }
                );
            }

            return res.status(201).json({ message: "Đã cập nhật thanh toán đủ" });
        } else {
            payment.status = "canceled";
            await payment.save();
            return res.status(400).json({ message: "Thanh toán không thành công" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Lỗi callback!", error: error.message });
    }
};
//lấy dữ liệu cho modal thanh toán cuối cùng
const getAppointmentDetail = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate("serviceId")         // lấy tên dịch vụ
            .populate("serviceOptionId");  // lấy tùy chọn + giá

        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }
        res.json(appointment);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
};
// Lấy tổng tiền đã cọc cho lịch hẹn
const getDepositTotal = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        // Kiểm tra id hợp lệ
        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: "appointmentId không hợp lệ" });
        }

        const results = await Payment.aggregate([
            {
                $match: {
                    appointmentId: new mongoose.Types.ObjectId(appointmentId),
                    type: "deposit",
                    status: "paid"
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        res.json({ totalPaidDeposit: results[0]?.total || 0 });
    } catch (error) {
        console.error("Lỗi getDepositTotal:", error); // log ra để debug
        res.status(500).json({ message: "Lỗi thống kê cọc", error: error.message });
    }
}


module.exports = {
    createFinalOnlinePayment,
    createFinalCashPayment,
    getAppointmentDetail,
    getDepositTotal
};
