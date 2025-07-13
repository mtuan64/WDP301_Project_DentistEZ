const Payment = require("../models/Payment");
const PayOS = require("@payos/node");
// require("dotenv").config();

// Khởi tạo PayOS SDK
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

exports.createPayment = async (req, res) => {
  try {
    const { amount, description, appointmentId } = req.body;

    const orderCode = Math.floor(Math.random() * 1000000000); // dưới 10^9
    const limitedDescription = description.substring(0, 25);

    const response = await payos.createPaymentLink({
      orderCode,
      amount,
      description: limitedDescription,
      returnUrl: "http://localhost:5173/payment-success",
      cancelUrl: "http://localhost:5173/payment-cancel",
    });

    const payment = await Payment.create({
      amount,
      description: limitedDescription,
      orderCode,
      payUrl: response.checkoutUrl,
      qrCode: response.qrCode,
      appointmentId,
    });

    res.status(200).json({
      msg: "Tạo link thanh toán thành công",
      payment,
    });
  } catch (error) {
    console.error(
      "Lỗi khi tạo link thanh toán PayOS:",
      error.response?.data || error.message || error
    );
    res
      .status(500)
      .json({ msg: "Tạo thanh toán thất bại", error: error.message });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderCode } = req.params;

    // Gọi PayOS để lấy trạng thái đơn hàng
    const payOSRes = await payos.getPaymentLinkInformation(orderCode);

    // Cập nhật DB nếu trạng thái mới là "PAID"
    if (payOSRes.status === "PAID") {
      await Payment.findOneAndUpdate({ orderCode }, { status: "paid" });
    }

    res.status(200).json({
      msg: "Trạng thái đơn hàng",
      status: payOSRes.status,
      payment: payOSRes,
    });
  } catch (error) {
    console.error("Lỗi khi check trạng thái đơn:", error);
    res
      .status(500)
      .json({ msg: "Không lấy được trạng thái đơn", error: error.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử giao dịch:", error);
    res.status(500).json({ msg: "Không lấy được lịch sử giao dịch", error: error.message });
  }
};

exports.getPaymentByOrderCode = async (req, res) => {
  try {
    const { orderCode } = req.params;
    const payment = await Payment.findOne({ orderCode });

    if (!payment) {
      return res.status(404).json({ msg: "Không tìm thấy hóa đơn" });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error("Lỗi khi lấy hóa đơn:", error);
    res.status(500).json({ msg: "Không lấy được hóa đơn", error: error.message });
  }
};

exports.cancelPayment = async (req, res) => {
  try {
    const { orderCode } = req.params;

    // Gọi PayOS hủy đơn
    const payOSRes = await payos.cancelPaymentLink(orderCode);

    // Cập nhật status đơn trong DB nếu thành công
    await Payment.findOneAndUpdate(
      { orderCode },
      { status: "canceled" }
    );

    res.status(200).json({
      msg: "Hủy đơn thành công",
      payOSRes,
    });
  } catch (error) {
    console.error("Lỗi khi hủy đơn:", error);
    res.status(500).json({ msg: "Không hủy được đơn", error: error.message });
  }
};
