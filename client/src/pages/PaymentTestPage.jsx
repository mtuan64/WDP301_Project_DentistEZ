import React, { useState } from "react";
import axios from "axios";
import { Button, Container, Form } from "react-bootstrap";
import { QRCodeCanvas } from "qrcode.react";

const PaymentTestPage = () => {
  const [step, setStep] = useState("doctor");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payUrl, setPayUrl] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);
  const [embedOpen, setEmbedOpen] = useState(false);

  const serviceData = [
    { id: "service1", title: "Tư Vấn", price: 2000 },
    { id: "service2", title: "Làm Sạch Răng", price: 5000 },
    { id: "service3", title: "Điều Trị Tủy Răng", price: 2000 },
  ];

  const timeSlots = [
    "09:00 Sáng",
    "10:00 Sáng",
    "11:00 Sáng",
    "12:00 Trưa",
    "01:00 Chiều",
    "02:00 Chiều",
    "03:00 Chiều",
    "04:00 Chiều",
    "05:00 Chiều",
  ];

  const paymentData = [
    { id: "pay1", name: "Thanh Toán Sau" },
    { id: "pay2", name: "Thanh Toán Trực Tuyến" },
    { id: "pay3", name: "Thẻ Tín Dụng" },
  ];

  const fakeDoctors = [
    { id: "doctor1", name: "Dr. Tùng" },
    { id: "doctor2", name: "Dr. Linh" },
    { id: "doctor3", name: "Dr. Khánh" },
  ];

  const handleCreatePayment = async () => {
    try {
      const service = serviceData.find((s) => s.id === selectedService);
      if (!service) {
        setError("Không tìm thấy dịch vụ đã chọn");
        return;
      }

      const description = `Thanh toán ${service.title}`.substring(0, 25);

      const response = await axios.post(
        "http://localhost:9999/api/create-payment",
        {
          amount: service.price,
          description,
        }
      );

      const { payUrl, qrCode } = response.data.payment;

      if (!payUrl || !qrCode) {
        setError("API không trả về đầy đủ thông tin");
        return;
      }

      setPayUrl(payUrl);
      setQrCode(qrCode);
      setStep("done");
    } catch (err) {
      console.error(err);
      setError("Tạo thanh toán thất bại");
    }
  };

  const handleOpenEmbeddedPayment = () => {
    const config = {
      RETURN_URL: window.location.href,
      ELEMENT_ID: "embeded-payment-container",
      CHECKOUT_URL: payUrl,
      embedded: true,
      onSuccess: () => {
        alert("Thanh toán thành công!");
        window.location.reload();
      },
    };

    PayOSCheckout.open(config);
    setEmbedOpen(true);
  };

  const renderStep = () => {
    switch (step) {
      case "doctor":
        return (
          <div>
            <h3>Chọn Bác Sĩ</h3>
            {fakeDoctors.map((doc) => (
              <Button
                key={doc.id}
                className="m-2"
                variant={selectedDoctor === doc.id ? "primary" : "outline-primary"}
                onClick={() => setSelectedDoctor(doc.id)}
              >
                {doc.name}
              </Button>
            ))}
            <div className="mt-3">
              <Button onClick={() => setStep("service")} disabled={!selectedDoctor}>
                Tiếp
              </Button>
            </div>
          </div>
        );

      case "service":
        return (
          <div>
            <h3>Chọn Dịch Vụ</h3>
            {serviceData.map((svc) => (
              <Button
                key={svc.id}
                className="m-2"
                variant={selectedService === svc.id ? "primary" : "outline-primary"}
                onClick={() => setSelectedService(svc.id)}
              >
                {svc.title}
              </Button>
            ))}
            <div className="mt-3">
              <Button variant="secondary" onClick={() => setStep("doctor")}>
                Quay lại
              </Button>{" "}
              <Button onClick={() => setStep("datetime")} disabled={!selectedService}>
                Tiếp
              </Button>
            </div>
          </div>
        );

      case "datetime":
        return (
          <div>
            <h3>Chọn Ngày và Giờ</h3>
            <Form.Control
              type="date"
              className="mb-3"
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <div>
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  className="m-2"
                  variant={selectedTime === time ? "primary" : "outline-primary"}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
            <div className="mt-3">
              <Button variant="secondary" onClick={() => setStep("service")}>
                Quay lại
              </Button>{" "}
              <Button
                onClick={() => setStep("payment")}
                disabled={!selectedDate || !selectedTime}
              >
                Tiếp
              </Button>
            </div>
          </div>
        );

      case "payment":
        return (
          <div>
            <h3>Chọn Phương Thức Thanh Toán</h3>
            {paymentData.map((pay) => (
              <Button
                key={pay.id}
                className="m-2"
                variant={selectedPayment === pay.id ? "primary" : "outline-primary"}
                onClick={() => setSelectedPayment(pay.id)}
              >
                {pay.name}
              </Button>
            ))}
            <div className="mt-3">
              <Button variant="secondary" onClick={() => setStep("datetime")}>
                Quay lại
              </Button>{" "}
              <Button onClick={() => setStep("confirm")} disabled={!selectedPayment}>
                Tiếp
              </Button>
            </div>
          </div>
        );

      case "confirm":
        return (
          <div>
            <h3>Xác nhận đặt lịch và thanh toán</h3>
            <p>Bác sĩ: {fakeDoctors.find((d) => d.id === selectedDoctor)?.name}</p>
            <p>Dịch vụ: {serviceData.find((s) => s.id === selectedService)?.title}</p>
            <p>Ngày: {selectedDate}</p>
            <p>Giờ: {selectedTime}</p>
            <p>Thanh toán: {paymentData.find((p) => p.id === selectedPayment)?.name}</p>
            <Button onClick={handleCreatePayment}>Tạo thanh toán</Button>
            {error && <p className="text-danger mt-3">{error}</p>}
          </div>
        );

      case "done":
        return (
          <div>
            <h3>Thanh toán trực tuyến</h3>
            <p>
              <strong>Số tiền:</strong>{" "}
              {serviceData.find((s) => s.id === selectedService)?.price.toLocaleString()} VNĐ
            </p>
            <p>
              <strong>Mô tả:</strong>{" "}
              {`Thanh toán ${serviceData.find((s) => s.id === selectedService)?.title}`}
            </p>

            {qrCode && (
              <div>
                <QRCodeCanvas value={qrCode} size={250} />
                <p className="text-muted mt-2">Hoặc quét mã để thanh toán</p>
              </div>
            )}

            <div className="mt-4">
              <Button variant="success" onClick={handleOpenEmbeddedPayment}>
                Thanh toán ngay tại đây
              </Button>
              <Button className="ms-2" onClick={() => window.location.reload()}>
                Tạo mới
              </Button>
            </div>

            {embedOpen && (
              <div
                id="embeded-payment-container"
                style={{
                  marginTop: "20px",
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  padding: "10px",
                  minHeight: "600px",
                }}
              ></div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4">Kiểm thử API Thanh Toán Lịch Hẹn</h2>
      {renderStep()}
    </Container>
  );
};

export default PaymentTestPage;
