import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import axios from "axios";

const AppointmentPage = () => {
  const [step, setStep] = useState("doctor");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [doctorData, setDoctorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const serviceData = [
    { id: "service1", title: "Tư Vấn", price: "500.000 VNĐ" },
    { id: "service2", title: "Làm Sạch Răng", price: "150.000 VNĐ" },
    { id: "service3", title: "Điều Trị Tủy Răng", price: "300.000 VNĐ" }
  ];

  const timeSlots = [
    "09:00 Sáng", "10:00 Sáng", "11:00 Sáng", "12:00 Trưa", "01:00 Chiều",
    "02:00 Chiều", "03:00 Chiều", "04:00 Chiều", "05:00 Chiều"
  ];

  const paymentData = [
    { id: "pay1", name: "Thanh Toán Sau" },
    { id: "pay2", name: "Thanh Toán Trực Tuyến" },
    { id: "pay3", name: "Thẻ Tín Dụng" }
  ];

  const steps = [
    { id: "doctor", title: "Chọn Bác Sĩ", desc: "Lựa chọn bác sĩ" },
    { id: "service", title: "Chọn Dịch Vụ", desc: "Lựa chọn dịch vụ" },
    { id: "datetime", title: "Ngày và Giờ", desc: "Chọn thời gian" },
    { id: "payment", title: "Thanh Toán", desc: "Chọn phương thức thanh toán" },
    { id: "confirm", title: "Xác Nhận", desc: "Đặt lịch hoàn tất" }
  ];

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Đang lấy danh sách bác sĩ từ API...");
      const response = await axios.get("http://localhost:9999/api/doctor");
      console.log("Phản hồi API:", response.data);

      // Handle API response more robustly
      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error("Dữ liệu bác sĩ không hợp lệ");
      }

      const formattedData = response.data.data
        .filter(doctor => doctor.Status === 'active')
        .map(doctor => ({
          id: doctor._id,
          name: doctor.userId?.fullname || 'Không xác định',
          specialty: doctor.Specialty || 'N/A',
          experienceYears: doctor.ExperienceYears || 0,
          profileImage: doctor.ProfileImage || null
        }));

      setDoctorData(formattedData);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách bác sĩ:", err);
      setError(err.message || "Không thể tải danh sách bác sĩ. Vui lòng kiểm tra kết nối hoặc thử lại.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleConfirm = async () => {
    try {
      const appointmentData = {
        doctorId: selectedDoctor,
        serviceId: selectedService,
        date: selectedDate,
        time: selectedTime,
        paymentMethod: selectedPayment
      };

      // Placeholder API call to submit appointment
      const response = await axios.post("http://localhost:9999/api/appointment", appointmentData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.data.success) {
        setStep("confirm");
      } else {
        throw new Error(response.data.message || "Không thể đặt lịch hẹn");
      }
    } catch (err) {
      console.error("Lỗi khi đặt lịch hẹn:", err);
      setError(err.message || "Đã xảy ra lỗi khi đặt lịch hẹn. Vui lòng thử lại.");
      setStep("payment"); // Stay on payment step to show error
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "doctor":
        if (loading) {
          return (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Đang tải danh sách bác sĩ...</p>
            </div>
          );
        }
        if (error) {
          return (
            <div className="text-center p-5 bg-white rounded shadow-sm">
              <p className="text-danger mb-3">{error}</p>
              <Button
                variant="primary"
                onClick={fetchDoctors}
              >
                Thử Lại
              </Button>
            </div>
          );
        }
        return (
          <div className="p-4 bg-white rounded shadow-sm">
            <h3 className="text-primary fw-bold mb-4">Chọn Bác Sĩ</h3>
            <Row>
              {doctorData.length === 0 ? (
                <Col className="text-center text-muted">Không có bác sĩ nào hoạt động</Col>
              ) : (
                doctorData.map((doctor) => (
                  <Col key={doctor.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                    <label
                      className={`doctor-card p-3 rounded border ${selectedDoctor === doctor.id ? 'border-primary bg-light' : 'border-secondary'}`}
                      onClick={() => setSelectedDoctor(doctor.id)}
                    >
                      <input type="radio" name="doctor" className="d-none" />
                      <div className="doctor-image-container mb-3">
                        {doctor.profileImage ? (
                          <img
                            src={doctor.profileImage}
                            alt={doctor.name}
                            className="doctor-image img-fluid rounded-circle"
                          />
                        ) : (
                          <div
                            className="doctor-image rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: '80px',
                              height: '80px',
                              backgroundColor: '#e0e0e0',
                              fontSize: '1.5rem',
                              color: '#6c757d'
                            }}
                          >
                            {doctor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h5 className="doctor-name text-dark fw-semibold mb-1">{doctor.name}</h5>
                      <p className="doctor-specialty text-muted small mb-1">{doctor.specialty}</p>
                      <p className="doctor-experience text-muted small">
                        {doctor.experienceYears} năm kinh nghiệm
                      </p>
                    </label>
                  </Col>
                ))
              )}
            </Row>
            <div className="text-end mt-4">
              <Button
                variant="primary"
                onClick={() => setStep("service")}
                disabled={!selectedDoctor}
              >
                Tiếp Theo
              </Button>
            </div>
          </div>
        );
      case "service":
        return (
          <div className="p-4 bg-white rounded shadow-sm">
            <h3 className="text-primary fw-bold mb-4">Chọn Dịch Vụ</h3>
            <Row>
              {serviceData.map((service) => (
                <Col key={service.id} md={6} className="mb-4">
                  <label
                    className={`border p-4 rounded text-center cursor-pointer hover:bg-light ${selectedService === service.id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <input type="radio" name="service" className="d-none" />
                    <h5 className="fw-semibold">{service.title}</h5>
                    <p className="text-muted small">{service.price}</p>
                  </label>
                </Col>
              ))}
            </Row>
            <div className="d-flex justify-content-between mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => setStep("doctor")}
              >
                Quay Lại
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep("datetime")}
                disabled={!selectedService}
              >
                Tiếp Theo
              </Button>
            </div>
          </div>
        );
      case "datetime":
        return (
          <div className="p-4 bg-white rounded shadow-sm">
            <h3 className="text-primary fw-bold mb-4">Chọn Ngày và Giờ</h3>
            <Row>
              <Col md={6} className="mb-4">
                <Flatpickr
                  options={{ inline: true, minDate: "today" }}
                  onChange={(date) => setSelectedDate(date[0])}
                  className="w-100"
                />
              </Col>
              <Col md={6}>
                <div className="d-flex flex-wrap gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </Col>
            </Row>
            <div className="d-flex justify-content-between mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => setStep("service")}
              >
                Quay Lại
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep("payment")}
                disabled={!selectedDate || !selectedTime}
              >
                Tiếp Theo
              </Button>
            </div>
          </div>
        );
      case "payment":
        return (
          <div className="p-4 bg-white rounded shadow-sm">
            <h3 className="text-primary fw-bold mb-4">Chọn Phương Thức Thanh Toán</h3>
            {error && <p className="text-danger mb-3">{error}</p>}
            <Row>
              <Col md={6}>
                <h5 className="text-muted mb-3">Chọn Thanh Toán</h5>
                {paymentData.map((payment) => (
                  <div
                    key={payment.id}
                    className={`border p-3 mb-2 rounded cursor-pointer hover:bg-light ${selectedPayment === payment.id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedPayment(payment.id)}
                  >
                    <input
                      type="radio"
                      name="payment"
                      className="me-2"
                      checked={selectedPayment === payment.id}
                      onChange={() => setSelectedPayment(payment.id)}
                    />
                    {payment.name}
                  </div>
                ))}
              </Col>
              <Col md={6}>
                <h5 className="text-muted mb-3">Tóm Tắt Lịch Hẹn</h5>
                <div className="border p-3 rounded">
                  <p className="small">Bác Sĩ: {doctorData.find(d => d.id === selectedDoctor)?.name || "N/A"}</p>
                  <p className="small">Ngày: {selectedDate ? selectedDate.toLocaleDateString('vi-VN') : "N/A"}</p>
                  <p className="small">Giờ: {selectedTime || "N/A"}</p>
                  <div className="mt-3 p-3 bg-light rounded">
                    <h6 className="small fw-bold">Dịch Vụ</h6>
                    <div className="d-flex justify-content-between small">
                      <span>{serviceData.find(s => s.id === selectedService)?.title || "N/A"}</span>
                      <span>{serviceData.find(s => s.id === selectedService)?.price || "N/A"}</span>
                    </div>
                  </div>
                  <div className="mt-3 d-flex justify-content-between small">
                    <strong>Tổng Chi Phí</strong>
                    <strong className="text-primary">{serviceData.find(s => s.id === selectedService)?.price || "N/A"}</strong>
                  </div>
                </div>
              </Col>
            </Row>
            <div className="d-flex justify-content-between mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => setStep("datetime")}
              >
                Quay Lại
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={!selectedPayment}
              >
                Xác Nhận
              </Button>
            </div>
          </div>
        );
      case "confirm":
        return (
          <div className="p-4 bg-white rounded shadow-sm text-center">
            <svg className="checkmark-animated mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
            <h3 className="text-primary fw-bold mb-3">Đặt Lịch Hẹn Thành Công!</h3>
            <p className="text-muted small">Vui lòng kiểm tra email để xác nhận.</p>
            <div className="mt-4 d-flex justify-content-center gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedDoctor(null);
                  setSelectedService(null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setSelectedPayment(null);
                  setStep("doctor");
                }}
              >
                Đặt Thêm Lịch Hẹn
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/')}
              >
                Về Trang Chủ
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>

      {/* <div className="bg-light py-3 px-5 d-none d-lg-block border-bottom shadow-sm">
        <Row className="align-items-center justify-content-between">
          <Col md={6} className="text-start">
            <small className="text-muted">
              <i className="far fa-clock text-primary me-2"></i>
              Giờ Mở Cửa: Thứ 2 - Thứ 3: 6:00 Sáng - 10:00 Tối, Chủ Nhật Nghỉ
            </small>
          </Col>
          <Col md={6} className="text-end">
            <small className="text-muted me-4">
              <i className="fa fa-envelope-open text-primary me-2"></i>
              info@example.com
            </small>
            <small className="text-muted">
              <i className="fa fa-phone-alt text-primary me-2"></i>
              +012 345 6789
            </small>
          </Col>
        </Row>
      </div> */}

      <div id="heroCarousel" className="carousel slide carousel-fade" data-bs-ride="carousel" data-bs-interval="4000">
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img
              src="https://mcohome.vn/wp-content/uploads/2023/03/z4146608990086_40d02c3b4e3dce3f26a1857fca47d952.jpg"
              className="d-block w-100"
              alt="Banner Đặt Lịch Hẹn"
              style={{ objectFit: 'cover', height: '80vh', borderRadius: '8px' }}
            />
            <div
              className="carousel-caption d-flex flex-column justify-content-center align-items-center"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                position: 'absolute',
                borderRadius: '8px'
              }}
            >
              <h1 className="display-3 fw-bold text-white mb-3">Đặt Lịch Hẹn</h1>
              <p className="text-white fs-5">Dễ dàng đặt lịch với bác sĩ nha khoa hàng đầu</p>
            </div>
          </div>
        </div>
      </div>

      <Container className="py-5">
        <section className="mb-5">
          <Row className="align-items-start">
            <Col lg={3} className="mb-4 mb-lg-0">
              <div className="bg-primary text-white p-4 rounded shadow-sm sticky-top" style={{ top: '20px' }}>
                <ul className="list-unstyled">
                  {steps.map((s, index) => (
                    <li
                      key={s.id}
                      className={`d-flex align-items-center mb-3 ${step === s.id ? 'fw-bold' : ''}`}
                    >
                      <span
                        className={`d-inline-block rounded-circle text-center me-2 ${steps.findIndex(st => st.id === step) >= index ? 'bg-white text-primary' : 'bg-light text-white'}`}
                        style={{ width: '24px', height: '24px', lineHeight: '24px' }}
                      >
                        {steps.findIndex(st => st.id === step) >= index ? '✓' : '•'}
                      </span>
                      <div>
                        <div className="small fw-semibold">{s.title}</div>
                        <div className="small text-light">{s.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>
            <Col lg={9}>
              {renderStepContent()}
            </Col>
          </Row>
        </section>
      </Container>

    </>
  );
};

export default AppointmentPage;