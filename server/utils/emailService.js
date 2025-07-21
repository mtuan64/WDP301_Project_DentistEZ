const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("Email transporter error:", error);
  } else {
    console.log("Email transporter is ready.");
  }
});

/**
 * Gửi email cho người dùng
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} text - Nội dung text thuần (fallback)
 * @param {string} html - Nội dung HTML định dạng (tuỳ chọn)
 */
const sendEmail = async (to, subject, text, html = null) => {
  try {
    console.log(`Sending email to ${to}: ${subject}`);
    await transporter.sendMail({
      from: `"DentistEZ" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent successfully.");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendEmail;
