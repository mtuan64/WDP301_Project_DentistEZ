const Payment = require("../models/Payment");
const PayOS = require("@payos/node");

// Khởi tạo PayOS SDK
const payos = new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY);

exports.createPayment = async (req, res) => {
  try {
    const { amount, description, appointmentId } = req.body;

    // Tạo orderCode duy nhất (vd: timestamp + random)
    const orderCode = Date.now().toString();

    // Gửi request tạo thanh toán lên PayOS
    const response = await payos.createPaymentLink({
      orderCode,
      amount,
      description,
      returnUrl: "http://localhost:5173/payment-success",
      cancelUrl: "http://localhost:5173/payment-cancel"
    });

    // Lưu vào DB (tuỳ)
    const payment = await Payment.create({
      amount,
      description,
      orderCode,
      payUrl: response.checkoutUrl,
      qrCode: response.qrCode,
      appointmentId
    });

    res.status(200).json({
      msg: "Tạo link thanh toán thành công",
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Tạo thanh toán thất bại" });
  }
};
