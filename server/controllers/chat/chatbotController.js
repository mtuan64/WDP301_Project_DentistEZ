require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const Service = mongoose.model("Service");
const ServiceOption = mongoose.model("ServiceOption");

const conversationHistory = {};

const chatbotController = {
  chatWithAI: async (req, res) => {
    try {
      const { message, sessionId, user } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Initialize conversation history
      if (!conversationHistory[sessionId]) {
        conversationHistory[sessionId] = [];
      }

      conversationHistory[sessionId].push({ role: "user", content: message });

      // Intent detection based on keywords
      const lowerCaseMessage = message.toLowerCase();
      let response;

      // Service Information Intent
      if (
        lowerCaseMessage.includes("các dịch vụ") ||
        lowerCaseMessage.includes("service") ||
        lowerCaseMessage.includes("gói dịch vụ") ||
        lowerCaseMessage.includes("trám răng") ||
        lowerCaseMessage.includes("nhổ răng")
      ) {
        const services = await Service.find()
          .populate("doctorId", "userId")
          .populate("clinicId", "clinic_name");
        const serviceOptions = await ServiceOption.find();

        let serviceResponse = "Danh sách các dịch vụ hiện có:<br>";
        services.forEach((service) => {
          serviceResponse += `- <b><a href="/services">${service.serviceName}</a></b>: ${service.description}<br>`;
          const options = serviceOptions.filter(
            (opt) => opt.serviceId.toString() === service._id.toString()
          );
          if (options.length > 0) {
            serviceResponse += "  <b>Gói dịch vụ</b>:<br>";
            options.forEach((opt) => {
              serviceResponse += `    - <a href="/services">${
                opt.optionName
              }</a>: ${Number(opt.price).toLocaleString()} ₫<br>`;
            });
          }
          if (service.image) {
            serviceResponse += `<img src="${service.image}" alt="${service.serviceName}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;margin:5px 0;"><br>`;
          }
        });
        response = serviceResponse;

        // Booking Process Intent
      } else if (
        lowerCaseMessage.includes("đặt lịch") ||
        lowerCaseMessage.includes("booking") ||
        lowerCaseMessage.includes("đặt hẹn") ||
        lowerCaseMessage.includes("cách đặt lịch")
      ) {
        response = `Chào ${
          user?.fullname || "bạn"
        }, để đặt lịch khám, bạn vui lòng làm theo các bước sau:<br>
<ol>
  <li><b>Chọn Dịch Vụ</b>: Truy cập trang đặt lịch và chọn dịch vụ nha khoa mong muốn (ví dụ: Trám răng, Nhổ răng).</li>
  <li><b>Chọn Gói Dịch Vụ</b>: Chọn gói dịch vụ phù hợp với nhu cầu của bạn.</li>
  <li><b>Chọn Ngày</b>: Chọn ngày khám phù hợp từ lịch trống.</li>
  <li><b>Chọn Giờ</b>: Chọn khung giờ còn trống trong ngày đã chọn.</li>
  <li><b>Xác Nhận và Thanh Toán</b>: Kiểm tra thông tin, cập nhật hồ sơ cá nhân nếu cần, và thanh toán 30% tiền cọc để xác nhận lịch hẹn.</li>
  <li><b>Tải Lên Bệnh Án (Tùy Chọn)</b>: Nếu có bệnh án trước đó, bạn có thể tải lên để bác sĩ tham khảo.</li>
</ol>
<b>Lưu ý</b>: Bạn cần cập nhật đầy đủ thông tin cá nhân (họ tên, ngày sinh, email, số điện thoại, địa chỉ) trước khi đặt lịch. Nếu hủy lịch sau khi thanh toán, hệ thống sẽ giữ lại 10% tiền cọc.<br>
<a href="/appointment">Nhấn vào đây để đặt lịch ngay!</a>`;

        // Consultation Intent
      } else if (
        lowerCaseMessage.includes("tư vấn") ||
        lowerCaseMessage.includes("consult") ||
        lowerCaseMessage.includes("gợi ý") ||
        lowerCaseMessage.includes("nên chọn") ||
        lowerCaseMessage.includes("đề xuất") ||
        lowerCaseMessage.includes("dịch vụ nào tốt") ||
        lowerCaseMessage.includes("hãy tư vấn") ||
        lowerCaseMessage.includes("tôi cần tư vấn") ||
        lowerCaseMessage.includes("đau răng") ||
        lowerCaseMessage.includes("sứt răng") ||
        lowerCaseMessage.includes("làm trắng") ||
        lowerCaseMessage.includes("sâu răng") ||
        lowerCaseMessage.includes("gãy răng")
      ) {
        const services = await Service.find()
          .populate("doctorId", "userId")
          .populate("clinicId", "clinic_name");
        const serviceOptions = await ServiceOption.find();

        // Prepare service data for AI
        let serviceData = "Available services:\n";
        services.forEach((service) => {
          serviceData += `${service.serviceName}: ${service.description}\n`;
          const options = serviceOptions.filter(
            (opt) => opt.serviceId.toString() === service._id.toString()
          );
          if (options.length > 0) {
            serviceData += "Options:\n";
            options.forEach((opt) => {
              serviceData += `- ${opt.optionName}: ${Number(
                opt.price
              ).toLocaleString()} ₫\n`;
            });
          }
        });

        // Check if user requests a single "best" service
        const isSingleBestService =
          lowerCaseMessage.includes("1 loại dịch vụ") ||
          lowerCaseMessage.includes("chuẩn nhất") ||
          lowerCaseMessage.includes("tốt nhất") ||
          lowerCaseMessage.includes("chính xác nhất");

        // Send user query and service data to Google AI
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = isSingleBestService
          ? `User query: "${message}"\n${serviceData}\nBased on the user's query, recommend EXACTLY ONE dental service that is the most suitable for their issue. Explain why it is the best choice. Keep the response concise, professional, and in Vietnamese. Format the response as: "Recommended service: [Service Name]. Reason: [Explanation]."`
          : `User query: "${message}"\n${serviceData}\nBased on the user's query, recommend up to TWO dental services that are suitable for their issue and explain why they are appropriate. Keep the response concise, professional, and in Vietnamese.`;
        const result = await model.generateContent(prompt);
        const aiResponse = await result.response;
        let recommendedServicesText = aiResponse.text().replace(/\*\*/g, "");

        // Parse AI response to extract service name(s)
        const recommendedServiceNames = isSingleBestService
          ? [
              recommendedServicesText
                .match(/Recommended service: ([^\.]+)/)?.[1]
                ?.trim() || "",
            ]
          : recommendedServicesText
              .match(/"([^"]+)"|(\w+(?:\s+\w+)*)/g)
              ?.map((name) => name.replace(/"/g, "").trim()) || [];

        // Filter services based on AI recommendations
        let consultResponse = `Chào ${
          user?.fullname || "bạn"
        }, dựa trên vấn đề bạn mô tả, dưới đây là gợi ý dịch vụ phù hợp:<br>`;
        if (services.length === 0) {
          consultResponse +=
            "Hiện tại chưa có dịch vụ nào được đăng ký. Vui lòng kiểm tra lại sau!<br>";
        } else {
          const matchedServices = services
            .filter((service) =>
              recommendedServiceNames.some(
                (name) =>
                  name &&
                  service.serviceName.toLowerCase().includes(name.toLowerCase())
              )
            )
            .slice(0, isSingleBestService ? 1 : 2); // Strictly one service for "best" queries

          if (matchedServices.length === 0) {
            consultResponse +=
              "Không tìm thấy dịch vụ phù hợp. Vui lòng mô tả chi tiết hơn về vấn đề của bạn!<br>";
          } else {
            matchedServices.forEach((service) => {
              consultResponse += `- <b><a href="/services">${service.serviceName}</a></b>: ${service.description}<br>`;
              const options = serviceOptions.filter(
                (opt) => opt.serviceId.toString() === service._id.toString()
              );
              if (options.length > 0) {
                const cheapestOption = options.reduce((min, opt) =>
                  Number(opt.price) < Number(min.price) ? opt : min
                );
                consultResponse += `  <b>Gói đề xuất</b>: ${
                  cheapestOption.optionName
                } - ${Number(cheapestOption.price).toLocaleString()} ₫<br>`;
              }
              if (service.image) {
                consultResponse += `<img src="${service.image}" alt="${service.serviceName}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;margin:5px 0;"><br>`;
              }
            });
            consultResponse += `<br>Lý do gợi ý: ${recommendedServicesText}<br>`;
          }
        }
        consultResponse += `Bạn có muốn biết thêm chi tiết? Hãy mô tả cụ thể hơn hoặc <a href="/appointment">nhấn vào đây</a> để đặt lịch ngay!`;
        response = consultResponse;

        // Default: Fallback to Google Generative AI
      } else {
        const combinedMessages = conversationHistory[sessionId]
          .map((entry) => `${entry.role}: ${entry.content}`)
          .join("\n");

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(combinedMessages);
        const aiResponse = await result.response;
        response = aiResponse.text().replace(/\*\*/g, "");
      }

      // Save assistant response to history
      conversationHistory[sessionId].push({
        role: "assistant",
        content: response,
      });

      res.json({ reply: response });
    } catch (error) {
      console.error(
        "Error in chatWithAI:",
        error.response?.data || error.message
      );
      res.status(500).json({
        error: "Failed to generate AI reply",
        details: error.response?.data || error.message,
      });
    }
  },
};

module.exports = chatbotController;
