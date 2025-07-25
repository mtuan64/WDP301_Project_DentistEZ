import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import "../assets/css/AppointmentPage.css"

const AppointmentPage = () => {
  const [step, setStep] = useState('service');
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceDetail, setServiceDetail] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [availableTimeslots, setAvailableTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [note, setNote] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = localStorage.getItem('token');

  const steps = [
    { id: 'service', title: 'Chọn Dịch Vụ', desc: 'Lựa chọn dịch vụ' },
    { id: 'option', title: 'Chọn Gói Dịch Vụ', desc: 'Lựa chọn gói dịch vụ' },
    { id: 'date', title: 'Chọn Ngày', desc: 'Chọn ngày hẹn' },
    { id: 'time', title: 'Chọn Giờ', desc: 'Chọn khung giờ' },
    { id: 'confirm', title: 'Xác Nhận', desc: 'Xác nhận và thanh toán' },
  ];

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:9999/api/view/service');
      if (Array.isArray(response.data)) {
        setServices(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setServices(response.data.data);
      } else {
        throw new Error('Dữ liệu dịch vụ không hợp lệ: Response data is not an array');
      }
    } catch (err) {
      setError(`Không thể tải danh sách dịch vụ: ${err.message}`);
      console.error('Lỗi khi lấy danh sách dịch vụ:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceDetail = async (serviceId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:9999/api/view-detail/service/${serviceId}`);
      if (response.data && Array.isArray(response.data.data)) {
        setServiceDetail(response.data.data[0]);
      } else if (response.data && response.data.data) {
        setServiceDetail(response.data.data);
      } else if (response.data && response.data._id) {
        setServiceDetail(response.data);
      } else {
        throw new Error('Dữ liệu chi tiết dịch vụ không hợp lệ: Invalid response structure');
      }
    } catch (err) {
      setError(`Không thể tải chi tiết dịch vụ: ${err.message}`);
      console.error('Lỗi khi lấy chi tiết dịch vụ:', err);
      setServiceDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTimeslots = (date) => {
    if (!serviceDetail || !serviceDetail.timeslots) {
      setAvailableTimeslots([]);
      return;
    }
    let filteredSlots = serviceDetail.timeslots || [];
    if (date) {
      filteredSlots = filteredSlots.filter(
        (slot) =>
          new Date(slot.date).toISOString().slice(0, 10) === date &&
          slot.isAvailable !== false
      );
    }
    setAvailableTimeslots(filteredSlots);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileType(selectedFile.type);
  };

  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('http://localhost:9999/app/upload-file', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setFileUrl(data.fileUrl);
        setModalMessage('Upload thành công');
        setShowModal(true);
      } else {
        setModalMessage('Upload thất bại: ' + data.message);
        setShowModal(true);
      }
    } catch (error) {
      setModalMessage('Lỗi kết nối server');
      setShowModal(true);
    }
  };

  const isUserProfileComplete = () => {
    return user?.fullname && user?.dateOfBirth && user?.email && user?.phone && user?.address;
  };

  const handleBooking = () => {
    if (!isUserProfileComplete()) {
      setModalMessage('Bạn cần đăng nhập và cập nhật đầy đủ hồ sơ cá nhân trước khi đặt lịch!');
      setShowModal(true);
      setTimeout(() => {
        setShowModal(false);
        navigate('/myprofile');
      }, 3000);
      return;
    }
    if (!selectedService || !selectedOptionId || !selectedDate || !selectedTimeSlot) {
      setModalMessage('Vui lòng chọn đầy đủ thông tin!');
      setShowModal(true);
      return;
    }
    setShowBookingModal(true);
  };

  const handlePayment = async () => {
    if (!selectedService || !selectedOptionId || !selectedDate || !selectedTimeSlot) {
      setModalMessage('Vui lòng chọn đầy đủ thông tin!');
      setShowModal(true);
      return;
    }
    const currentOption = serviceDetail?.options?.find((opt) => String(opt._id) === String(selectedOptionId));
    const depositAmount = currentOption ? Math.round(Number(currentOption.price) * 0.3) : 0;
    const payload = {
      serviceId: selectedService,
      serviceOptionId: selectedOptionId,
      timeslotId: selectedTimeSlot._id,
      note,
      fileUrl,
      fileName,
      fileType,
      amount: depositAmount,
      description: currentOption?.optionName || serviceDetail?.serviceName || 'Đặt lịch khám',
    };
    try {
      const res = await fetch('http://localhost:9999/app/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setModalMessage(data.message || 'Tạo thanh toán thành công! Đang chuyển sang trang thanh toán...');
        setShowModal(true);
        if (data.payment && data.payment.payUrl) {
          window.location.href = data.payment.payUrl;
        }
      } else {
        setModalMessage(data.message || 'Có lỗi xảy ra!');
        setShowModal(true);
      }
    } catch (err) {
      setModalMessage('Có lỗi kết nối server!');
      setShowModal(true);
    }
  };

  function formatDateOfBirth(isoDateStr) {
    if (!isoDateStr) return '';
    const date = new Date(isoDateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    if (services.length === 0) {
      fetchServices();
    }
  }, [services.length]);

  useEffect(() => {
    if (selectedService) {
      fetchServiceDetail(selectedService);
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedDate && serviceDetail) {
      fetchAvailableTimeslots(selectedDate);
    } else {
      setAvailableTimeslots([]);
    }
  }, [selectedDate, serviceDetail]);

  const styles = {
    container: {
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '0',
    },
    inner: {
      maxWidth: '1800px',
      margin: '0 auto',
      padding: '0 32px 50px 32px',
    },
    stepSection: {
      backgroundColor: 'white',
      padding: '48px 60px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      marginBottom: '38px',
      borderRadius: 15,
    },
    stepTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#007bff',
      marginBottom: '28px',
    },
    dateTimeSection: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '20px',
      padding: '30px',
      backgroundColor: '#fff',
      borderRadius: 15,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      margin: '20px 0',
    },
    optionLabel: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#333',
      marginBottom: '10px',
    },
    optionSelect: {
      width: '100%',
      padding: '15px',
      fontSize: '1rem',
      border: '2px solid #ddd',
      borderRadius: 10,
      backgroundColor: '#f8f9fa',
      transition: 'border-color 0.3s ease',
    },
    timeSlots: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      marginTop: '12px',
    },
    timeSlot: {
      padding: '10px 0',
      border: '1.5px solid #ddd',
      borderRadius: '7px',
      textAlign: 'center',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 600,
      background: '#fff',
      transition: 'all 0.2s',
    },
    timeSlotSelected: {
      backgroundColor: '#007bff',
      color: 'white',
      borderColor: '#007bff',
    },
    timeSlotDisabled: {
      backgroundColor: '#f5f5f5',
      color: '#999',
      cursor: 'not-allowed',
    },
    actionButtons: {
      display: 'flex',
      gap: '18px',
      justifyContent: 'flex-end',
      marginTop: '28px',
    },
    btn: {
      padding: '16px 0',
      border: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: '8px',
      fontSize: '18px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s',
      flex: 1,
      textAlign: 'center',
    },
    btnSecondary: {
      padding: '16px 0',
      border: '1px solid #6c757d',
      backgroundColor: 'transparent',
      color: '#6c757d',
      borderRadius: '8px',
      fontSize: '18px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s',
      flex: 1,
      textAlign: 'center',
    },
    bannerSection: {
      position: 'relative',
      width: '100%',
      height: '300px',
      marginBottom: '40px',
      overflow: 'hidden',
      borderRadius: '0 0 20px 20px',
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.3)',
      zIndex: 10000,
      display: showModal ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalContent: {
      background: '#fff',
      borderRadius: 16,
      width: '400px',
      maxWidth: '90vw',
      padding: '20px',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    },
    modalMessage: {
      fontSize: '16px',
      color: '#333',
      marginBottom: '20px',
    },
    modalButton: {
      padding: '10px 20px',
      border: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    modalBooking: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.3)',
      zIndex: 9999,
      display: showBookingModal ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBookingContent: {
      background: '#fff',
      borderRadius: 16,
      width: 900,
      maxWidth: '98vw',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      overflow: 'hidden',
      minHeight: 420,
      position: 'relative',
    },
    modalHeader: {
      width: '100%',
      padding: '22px 0 10px 0',
      textAlign: 'center',
      borderBottom: '1px solid #eee',
      background: '#f8f9fa',
    },
    modalTitle: {
      fontSize: 26,
      fontWeight: 700,
      color: '#007bff',
      letterSpacing: 1,
    },
    modalBody: {
      display: 'flex',
      width: '100%',
      flex: 1,
    },
    modalLeft: {
      flex: 1.2,
      padding: 32,
      borderRight: '1px solid #eee',
      background: '#f8f9fa',
    },
    modalRight: {
      flex: 1,
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    modalImage: {
      width: 140,
      height: 110,
      objectFit: 'cover',
      borderRadius: 8,
      boxShadow: '0 1px 8px #ccc',
    },
    modalInput: {
      width: '100%',
      border: '1px solid #ddd',
      borderRadius: 6,
      padding: '10px 14px',
      background: '#fafbfc',
    },
    modalTextarea: {
      width: '100%',
      border: '1px solid #ddd',
      borderRadius: 6,
      padding: '10px 14px',
      background: '#fafbfc',
      minHeight: 40,
    },
    fileUploadLabel: {
      background: '#f1f3f6',
      color: '#007bff',
      padding: '10px 22px',
      borderRadius: 8,
      fontWeight: 600,
      cursor: 'pointer',
      border: '1.5px solid #007bff',
      transition: 'all 0.2s',
      display: 'inline-block',
    },
    fileUploadButton: {
      background: file ? '#007bff' : '#b2c6e6',
      color: '#fff',
      padding: '10px 28px',
      border: 'none',
      borderRadius: 8,
      fontWeight: 700,
      fontSize: 16,
      cursor: file ? 'pointer' : 'not-allowed',
      boxShadow: file ? '0 1px 6px #007bff22' : 'none',
      transition: 'all 0.2s',
    },
    paymentButton: {
      background: '#e74c3c',
      color: '#fff',
      padding: '14px 38px',
      border: 'none',
      borderRadius: 8,
      fontWeight: 700,
      fontSize: 18,
      cursor: 'pointer',
      boxShadow: '0 2px 8px #e74c3c33',
    },
  };

  const currentOption = serviceDetail?.options?.find((opt) => String(opt._id) === String(selectedOptionId));
  const depositAmount = currentOption ? Math.round(Number(currentOption.price) * 0.3) : 0;
  const getCurrentPrice = () => (currentOption ? currentOption.price : serviceDetail?.price || 0);

  const renderStepContent = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải...</div>;
    }
    if (error) {
      return (
        <div style={styles.stepSection}>
          <p style={{ color: '#e74c3c', textAlign: 'center' }}>{error}</p>
          <button style={styles.btn} onClick={() => fetchServices()}>
            Thử lại
          </button>
        </div>
      );
    }

    switch (step) {
      case 'service':
        return (
          <div style={styles.stepSection}>
            <h3 style={styles.stepTitle}>Chọn Dịch Vụ</h3>
            <Row>
              {services.length === 0 ? (
                <Col className="text-center text-muted">Không có dịch vụ nào</Col>
              ) : (
                services.map((service) => (
                  <Col key={service._id} md={4} className="mb-4">
                    <div
                      className={`doctor-card ${selectedService === service._id ? 'selected' : ''}`}
                      onClick={() => setSelectedService(service._id)}
                    >
                      <div className="doctor-image-container">
                        <img
                          src={service.image || '/no-image.jpg'}
                          alt={service.serviceName}
                          className="doctor-image"
                        />
                      </div>
                      <h5 className="doctor-name">{service.serviceName}</h5>
                    </div>
                  </Col>
                ))
              )}
            </Row>
            <div style={styles.actionButtons}>
              <button style={styles.btn} onClick={() => setStep('option')} disabled={!selectedService}>
                Tiếp Theo
              </button>
            </div>
          </div>
        );
      case 'option':
        return (
          <div style={styles.stepSection}>
            <h3 style={styles.stepTitle}>Chọn Gói Dịch Vụ</h3>
            <Row>
              {serviceDetail?.options?.length === 0 ? (
                <Col className="text-center text-muted">Không có gói dịch vụ nào</Col>
              ) : (
                serviceDetail?.options?.map((option) => (
                  <Col key={option._id} md={4} className="mb-4">
                    <div
                      className={`doctor-card ${selectedOptionId === option._id ? 'selected' : ''}`}
                      onClick={() => setSelectedOptionId(option._id)}
                    >
                      <div className="doctor-image-container">
                        <img
                          src={option.image || '/no-image.jpg'}
                          alt={option.optionName}
                          className="doctor-image"
                        />
                      </div>
                      <h5 className="doctor-name">{option.optionName}</h5>
                      <p className="doctor-specialty">{Number(option.price).toLocaleString()} ₫</p>
                    </div>
                  </Col>
                ))
              )}
            </Row>
            <div style={styles.actionButtons}>
              <button style={styles.btnSecondary} onClick={() => setStep('service')}>
                Quay Lại
              </button>
              <button style={styles.btn} onClick={() => setStep('date')} disabled={!selectedOptionId}>
                Tiếp Theo
              </button>
            </div>
          </div>
        );
      case 'date':
        return (
          <div style={styles.stepSection}>
            <h3 style={styles.stepTitle}>Chọn Ngày</h3>
            <div style={styles.dateTimeSection}>
              <div>
                <label style={styles.optionLabel}>Chọn ngày:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTimeSlot(null);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  style={styles.optionSelect}
                />
              </div>
            </div>
            <div style={styles.actionButtons}>
              <button style={styles.btnSecondary} onClick={() => setStep('option')}>
                Quay Lại
              </button>
              <button style={styles.btn} onClick={() => setStep('time')} disabled={!selectedDate}>
                Tiếp Theo
              </button>
            </div>
          </div>
        );
      case 'time':
        return (
          <div style={styles.stepSection}>
            <h3 style={styles.stepTitle}>Chọn Giờ</h3>
            <div style={styles.dateTimeSection}>
              <div>
                <label style={styles.optionLabel}>Chọn giờ:</label>
                <div style={styles.timeSlots}>
                  {!selectedDate ? (
                    <span style={{ color: '#888' }}>Vui lòng chọn ngày trước</span>
                  ) : availableTimeslots.length > 0 ? (
                    availableTimeslots.map((slot, index) => (
                      <div
                        key={slot._id || slot.time || index}
                        style={{
                          ...styles.timeSlot,
                          ...(selectedTimeSlot === slot ? styles.timeSlotSelected : {}),
                          ...(slot.isAvailable === false ? styles.timeSlotDisabled : {}),
                        }}
                        onClick={() => slot.isAvailable !== false && setSelectedTimeSlot(slot)}
                      >
                        {slot.time
                          ? slot.time
                          : `${slot.start_time || ''}${slot.end_time ? ' - ' + slot.end_time : ''}`}
                        {slot.isAvailable === false && (
                          <span style={{ color: '#e74c3c', fontSize: 12, marginLeft: 6 }}>(Đã đặt)</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#888' }}>Không có slot nào</span>
                  )}
                </div>
              </div>
            </div>
            <div style={styles.actionButtons}>
              <button style={styles.btnSecondary} onClick={() => setStep('date')}>
                Quay Lại
              </button>
              <button style={styles.btn} onClick={handleBooking} disabled={!selectedTimeSlot}>
                Đặt Lịch Ngay
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bannerSection}>
        <img
          src="/images/homepage2.jpg"
          alt="Banner Đặt Lịch Hẹn"
          style={styles.bannerImage}
        />
      </div>
      <Container style={styles.inner}>
        <Row>
          <Col lg={3} className="mb-4 mb-lg-0">
            <div
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                position: 'sticky',
                top: '20px',
              }}
            >
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {steps.map((s, index) => (
                  <li
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px',
                      fontWeight: step === s.id ? 'bold' : 'normal',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '24px',
                        height: '24px',
                        lineHeight: '24px',
                        textAlign: 'center',
                        borderRadius: '50%',
                        backgroundColor: steps.findIndex((st) => st.id === step) >= index ? '#fff' : '#f8f9fa',
                        color: steps.findIndex((st) => st.id === step) >= index ? '#007bff' : '#fff',
                        marginRight: '8px',
                        fontSize: '14px',
                      }}
                    >
                      {steps.findIndex((st) => st.id === step) >= index ? (
                        <svg className="checkmark-animated" viewBox="0 0 52 52">
                          <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" strokeDasharray="166" strokeDashoffset="166" />
                          <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" strokeDasharray="48" strokeDashoffset="48" />
                        </svg>
                      ) : (
                        '•'
                      )}
                    </span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{s.title}</div>
                      <div style={{ fontSize: '12px', color: '#e6e6e6' }}>{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Col>
          <Col lg={9}>{renderStepContent()}</Col>
        </Row>
        {showBookingModal && (
          <div style={styles.modalBooking} onClick={() => setShowBookingModal(false)}>
            <div style={{
              ...styles.modalBookingContent,
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: window.innerWidth < 1000 ? '95vw' : '1080px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              minHeight: 420,
              position: 'relative',
              padding: 0,
            }} onClick={(e) => e.stopPropagation()}>

              <div style={styles.modalHeader}>
                <span style={styles.modalTitle}>Đặt Lịch Khám Bệnh</span>
              </div>

              <div style={{
                ...styles.modalBody,
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 800 ? '1fr' : '1fr 1.5fr',
                gap: 0
              }}>

                {/* CỘT 1: Thông tin dịch vụ */}
                <div style={{
                  ...styles.modalLeft,
                  borderRight: window.innerWidth < 800 ? 'none' : '1px solid #eee',
                  borderBottom: window.innerWidth < 800 ? '1px solid #eee' : 'none',
                  background: '#f8f9fa'
                }}>
                  <h3 style={{ color: '#007bff', marginBottom: 18 }}>Thông Tin Dịch Vụ</h3>
                  <div style={{ width: '100%', marginBottom: 20, textAlign: 'center' }}>
                    <img
                      src={currentOption?.image || serviceDetail?.image || '/no-image.jpg'}
                      alt={serviceDetail?.serviceName || '---'}
                      style={styles.modalImage}
                    />
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Tên dịch vụ: </span>
                    <span>{serviceDetail?.serviceName || '---'}</span>
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Giá dịch vụ: </span>
                    <span style={{ color: '#e74c3c', fontWeight: 700, fontSize: 20 }}>
                      {getCurrentPrice().toLocaleString()} ₫
                    </span>
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Gói dịch vụ: </span>
                    <span>{currentOption ? currentOption.optionName : '---'}</span>
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Bác sĩ: </span>
                    <span>{serviceDetail?.doctorId?.userId?.fullname || '---'}</span>
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Phòng khám: </span>
                    <span>{serviceDetail?.clinicId?.clinic_name || '---'}</span>
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Ngày khám: </span>
                    <span>{selectedDate || '---'}</span>
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Khung giờ: </span>
                    <span>
                      {selectedTimeSlot?.start_time && selectedTimeSlot?.end_time
                        ? `${selectedTimeSlot.start_time} - ${selectedTimeSlot.end_time}`
                        : selectedTimeSlot?.time || '---'}
                    </span>
                  </div>
                </div>

                {/* CỘT 2: Thông tin người đặt (GHÉP CỘT 2+3) */}
                <div style={{
                  ...styles.modalRight,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minWidth: 400,
                  background: '#fff'
                }}>

                  {/* Title căn giữa */}
                  <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <h3 style={{ color: '#007bff', fontSize: 18, margin: 0 }}>Thông Tin Người Đặt</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Grid 2 cột cho 4 trường đầu + địa chỉ */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr',
                      gap: 12,
                      marginBottom: 16
                    }}>
                      <div>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>
                          Họ và tên
                        </label>
                        <input type="text" value={user?.fullname || ''} readOnly style={styles.modalInput} />
                      </div>
                      <div>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>
                          Ngày sinh
                        </label>
                        <input
                          type="text"
                          value={formatDateOfBirth(user?.dateOfBirth) || ''}
                          readOnly
                          style={styles.modalInput}
                        />
                      </div>
                      <div>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>
                          Email
                        </label>
                        <input type="email" value={user?.email || ''} readOnly style={styles.modalInput} />
                      </div>
                      <div>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>
                          Số điện thoại
                        </label>
                        <input type="text" value={user?.phone || ''} readOnly style={styles.modalInput} />
                      </div>
                      <div style={{ gridColumn: window.innerWidth < 600 ? '1' : '1 / -1' }}>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>
                          Địa chỉ
                        </label>
                        <input type="text" value={user?.address || ''} readOnly style={styles.modalInput} />
                      </div>
                    </div>

                    {/* Ghi chú full width */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>
                        Ghi chú
                      </label>
                      <textarea
                        value={note || ''}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ghi chú thêm (nếu có)..."
                        style={styles.modalTextarea}
                      />
                    </div>

                    {/* Upload file full width */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#34495e' }}>
                        Tải lên file bệnh án trước đó (nếu có)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <label
                          htmlFor="file-upload"
                          style={styles.fileUploadLabel}
                          onMouseOver={(e) => (e.target.style.background = '#e6f0ff')}
                          onMouseOut={(e) => (e.target.style.background = '#f1f3f6')}
                        >
                          <i className="fa fa-upload" style={{ marginRight: 8 }}></i>
                          Chọn file
                          <input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.jpg,.png,.doc,.docx"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <button onClick={handleFileUpload} disabled={!file} style={styles.fileUploadButton}>
                          <i className="fa fa-cloud-upload" style={{ marginRight: 8 }}></i>
                          Tải lên
                        </button>
                      </div>
                      {fileName && (
                        <div style={{ fontSize: 14, color: '#007bff', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fa fa-file" style={{ fontSize: 16 }}></i>
                          <span>Đã chọn: {fileName}</span>
                        </div>
                      )}
                      {fileUrl && (
                        <div style={{ color: 'green', marginTop: 8, fontWeight: 600 }}>
                          <i className="fa fa-check-circle" style={{ marginRight: 6 }}></i>
                          File đã upload thành công!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tiền cọc + nút thanh toán căn giữa */}
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ color: '#e74c3c', fontWeight: 600 }}>
                        Số tiền bạn cần cọc trước 30% là: {depositAmount.toLocaleString()} ₫
                      </span>
                    </div>
                    <button style={{
                      ...styles.paymentButton,
                      minWidth: 200,
                      margin: 0 // Bỏ margin để căn giữa
                    }} onClick={handlePayment}>
                      Thanh Toán Ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div style={styles.modal} onClick={() => setShowModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalMessage}>{modalMessage}</div>
              <button style={styles.modalButton} onClick={() => setShowModal(false)}>OK</button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default AppointmentPage;