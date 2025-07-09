import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Col, Row } from 'react-bootstrap';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [note, setNote] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [file, setFile] = useState(null);


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileType(selectedFile.type);
  }

  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:9999/app/upload-file", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setFileUrl(data.fileUrl); // URL file trên Cloudinary
        alert("Upload thành công");
      } else {
        alert("Upload thất bại: " + data.message);
      }
    } catch (error) {
      alert("Lỗi kết nối server");
    }
  };

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = localStorage.getItem('token');




  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:9999/api/view-detail/service/${id}`);
        const data = await response.json();
        if (Array.isArray(data.data)) {
          setService(data.data[0]);
        } else if (data.data) {
          setService(data.data);
        } else {
          setService(null);
        }
      } catch (error) {
        setService(null);
      }
      setLoading(false);
    };
    fetchService();
  }, [id]);

  // Lấy options (gói dịch vụ)
  const options = service?.options || [];
  const prices = options.map(opt => Number(opt.price)).filter(price => !isNaN(price));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  // Lấy option đang chọn
  const currentOption = options.find(
    opt => String(opt._id) === String(selectedOptionId)
  );
  const depositAmount = currentOption ? Math.round(Number(currentOption.price) * 0.3) : 0;


  // Ảnh chính: Nếu chọn option và option có ảnh thì lấy ảnh option, nếu không lấy ảnh chính
  const mainImage = currentOption?.image || service?.image;


  // Tạo mảng thumbnail: ảnh chính + ảnh các option (loại trùng)
  const images = [
    ...(service?.image ? [service.image] : []),
    ...options.map(opt => opt.image).filter(img => img && img !== service?.image)
  ];

  // Lấy timeslots, lọc theo ngày nếu có
  let slots = service?.timeslots || [];
  if (selectedDate) {
    slots = slots.filter(slot =>
      new Date(slot.date).toISOString().slice(0, 10) === selectedDate
    );
  }

  // Lấy giá theo option đã chọn
  const getCurrentPrice = () => currentOption ? currentOption.price : service.price;

  const isUserProfileComplete = () => {
    return (
      user?.fullname &&
      user?.dateOfBirth &&
      user?.email &&
      user?.phone &&
      user?.address
    );
  };

  const handleBooking = () => {
    if (!isUserProfileComplete()) {
      alert('Bạn cần cập nhật đầy đủ hồ sơ cá nhân trước khi đặt lịch!');
      navigate('/myprofile'); // hoặc đường dẫn trang cập nhật hồ sơ của bạn
      return;
    }
    if (!selectedOptionId || !selectedDate || !selectedTimeSlot) {
      alert('Vui lòng chọn đầy đủ thông tin!');
      return;
    }
    console.log('Mở modal đặt lịch');
    setShowBookingModal(true);
  };

  const handlePayment = async () => {
    if (!selectedOptionId || !selectedDate || !selectedTimeSlot) {
      alert('Vui lòng chọn đầy đủ thông tin!');
      return;
    }

    const payload = {
      serviceId: service._id,
      serviceOptionId: selectedOptionId,
      timeslotId: selectedTimeSlot._id,
      note,
      fileUrl,
      fileName,
      fileType,
      amount: depositAmount,
      description: currentOption?.optionName || service?.serviceName || "Đặt lịch khám"
    };

    try {
      // Đổi endpoint thành /create-payment
      const res = await fetch('http://localhost:9999/app/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Tạo thanh toán thành công! Đang chuyển sang trang thanh toán...");
        // Nếu có link thanh toán, chuyển hướng luôn
        if (data.payment && data.payment.payUrl) {
          window.location.href = data.payment.payUrl;
        }
      } else {
        alert(data.message || "Có lỗi xảy ra!");
      }
    } catch (err) {
      alert("Có lỗi kết nối server!");
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




  if (loading || !service) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải...</div>;
  }

  // Layout mới: container rộng, productSection full chiều ngang, padding lớn, không border-radius
  const styles = {
    container: {
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '0'
    },
    inner: {
      maxWidth: '1800px',
      margin: '0 auto',
      padding: '0 32px 50px 32px'
    },
    breadcrumb: {
      padding: '22px 0 10px 0',
      fontSize: '15px',
      color: '#6c757d'
    },
    productSection: {
      display: 'grid',
      gridTemplateColumns: '2fr 3fr',
      gap: '64px',
      backgroundColor: 'white',
      padding: '48px 60px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      marginBottom: '38px',
      borderRadius: 0 // không bo góc
    },
    imageGallery: {
      display: 'flex',
      flexDirection: 'column',
      gap: '18px'
    },
    mainImage: {
      width: '100%',
      height: '480px',
      borderRadius: '10px',
      overflow: 'hidden'
    },
    mainImageImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    thumbnails: {
      display: 'flex',
      gap: '14px'
    },
    thumbnail: {
      width: '90px',
      height: '90px',
      borderRadius: '7px',
      overflow: 'hidden',
      cursor: 'pointer',
      border: '2px solid transparent'
    },
    thumbnailActive: {
      border: '2.5px solid #007bff'
    },
    thumbnailImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    productInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '28px'
    },
    productTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#007bff',
      margin: 0
    },
    priceSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '18px'
    },
    currentPrice: {
      fontSize: '34px',
      fontWeight: 'bold',
      color: '#e74c3c'
    },
    optionSection: {
      padding: '18px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px'
    },
    optionLabel: {
      fontWeight: '600',
      marginBottom: '12px',
      display: 'block'
    },
    optionSelect: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '7px',
      fontSize: '16px'
    },
    dateTimeSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '18px'
    },
    timeSlots: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      marginTop: '12px'
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
      transition: 'all 0.2s'
    },
    timeSlotSelected: {
      backgroundColor: '#007bff',
      color: 'white',
      borderColor: '#007bff'
    },
    timeSlotDisabled: {
      backgroundColor: '#f5f5f5',
      color: '#999',
      cursor: 'not-allowed'
    },
    actionButtons: {
      display: 'flex',
      gap: '18px'
    },
    btnBookNow: {
      flex: 1,
      padding: '16px 0',
      border: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: '8px',
      fontSize: '18px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    detailTabs: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    },
    tabHeaders: {
      display: 'flex',
      borderBottom: '1px solid #eee'
    },
    tabHeader: {
      flex: 1,
      padding: '18px 0',
      backgroundColor: '#f8f9fa',
      border: 'none',
      cursor: 'pointer',
      fontSize: '17px',
      fontWeight: '600',
      transition: 'all 0.2s'
    },
    tabHeaderActive: {
      backgroundColor: 'white',
      color: '#007bff',
      borderBottom: '2.5px solid #007bff'
    },
    tabContent: {
      padding: '36px'
    },
    topbar: {
      backgroundColor: '#f8f9fa',
      padding: '8px 20px',
      fontSize: '14px'
    },
    bannerSection: {
      position: 'relative',
      width: '100%',
      height: '300px',
      marginBottom: '40px',
      overflow: 'hidden',
      borderRadius: '0 0 20px 20px'
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  };

  return (
    <div style={styles.container}>
      {/* Topbar */}
      <div style={styles.topbar} className="d-none d-lg-block">
        <Row className="align-items-center justify-content-between">
          <Col md={6} className="text-start">
            <small>
              <i className="far fa-clock text-primary me-2"></i>
              Opening Hours: Mon - Tues : 6.00 am - 10.00 pm, Sunday Closed
            </small>
          </Col>
          <Col md={6} className="text-end">
            <small className="me-4">
              <i className="fa fa-envelope-open text-primary me-2"></i>
              info@example.com
            </small>
            <small>
              <i className="fa fa-phone-alt text-primary me-2"></i>
              +012 345 6789
            </small>
          </Col>
        </Row>
      </div>
      {/* Banner Section */}
      <div style={styles.bannerSection}>
        <img
          src="/images/servicebanner.png"
          alt="Service Banner"
          style={styles.bannerImage}
          onError={e => {
            e.target.src = '/api/placeholder/1200/300';
          }}
        />
      </div>
      <div style={styles.inner}>
        {/* Breadcrumb */}
        <div style={styles.breadcrumb}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Trang chủ</span>
          {' > '}
          <span onClick={() => navigate('/services')} style={{ cursor: 'pointer' }}>Dịch vụ</span>
          {' > '}
          <span>{service.serviceName || service.name}</span>
        </div>
        {/* Product Section */}
        <div style={styles.productSection}>
          {/* Image Gallery */}
          <div style={styles.imageGallery}>
            <div style={styles.mainImage}>
              <img
                src={mainImage || '/api/placeholder/500/400'}
                alt={service.serviceName || service.name}
                style={styles.mainImageImg}
              />
            </div>
            <div style={styles.thumbnails}>
              {images.map((img, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.thumbnail,
                    ...(mainImage === img ? styles.thumbnailActive : {})
                  }}
                  onClick={() => {
                    setSelectedOptionId(
                      options.find(opt => opt.image === img)?.optionName || ''
                    );
                  }}
                >
                  <img
                    src={img || '/api/placeholder/80/80'}
                    alt={`${service.serviceName || service.name} ${index + 1}`}
                    style={styles.thumbnailImg}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Product Info */}
          <div style={styles.productInfo}>
            <h1 style={styles.productTitle}>{service.serviceName}</h1>
            <div style={styles.priceSection}>
              <span style={styles.currentPrice}>
                {selectedOptionId
                  ? `${Number(getCurrentPrice()).toLocaleString()}₫`
                  : minPrice === maxPrice
                    ? `${minPrice.toLocaleString()}₫`
                    : `${minPrice.toLocaleString()}₫ – ${maxPrice.toLocaleString()}VND`
                }
              </span>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#212529', margin: '8px 0' }}>
              {service.doctorId && service.doctorId.userId && service.doctorId.userId.fullname
                ? `Bác sĩ: ${service.doctorId.userId.fullname}`
                : ''}
            </h2>
            <h3 style={{ fontSize: 18, fontWeight: 500, color: '#222', margin: '6px 0 0 0' }}>
              {service.clinicId && service.clinicId.clinic_name
                ? `Phòng khám: ${service.clinicId.clinic_name}`
                : ''}
            </h3>



            {/* Service Options */}
            <div style={styles.optionSection}>
              <label style={styles.optionLabel}>Chọn gói dịch vụ:</label>
              <select
                value={selectedOptionId}
                onChange={e => setSelectedOptionId(e.target.value)}
                style={styles.optionSelect}
              >
                <option value="">Chọn gói dịch vụ</option>
                {service.options.map((option, index) => (
                  <option key={option._id || index} value={option._id}>
                    {option.optionName} - {option.price.toLocaleString()}VND
                  </option>
                ))}
              </select>
            </div>
            {/* Date & Time Selection */}
            <div style={styles.dateTimeSection}>
              <div>
                <label style={styles.optionLabel}>Chọn ngày:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => {
                    setSelectedDate(e.target.value);
                    setSelectedTimeSlot('');

                  }}
                  min={new Date().toISOString().split('T')[0]}
                  style={styles.optionSelect}
                />
              </div>
              <div>
                <label style={styles.optionLabel}>Chọn giờ:</label>
                <div style={styles.timeSlots}>
  {!selectedDate ? (
    <span style={{ color: '#888' }}>Vui lòng chọn ngày trước</span>
  ) : slots.length > 0 ? (
    slots.map((slot, index) => (
      <div
        key={slot._id || slot.time || index}
        style={{
          ...styles.timeSlot,
          ...(selectedTimeSlot === slot ? styles.timeSlotSelected : {}),
          // Nếu slot đã được đặt thì mờ đi
          ...(slot.isAvailable === false ? styles.timeSlotDisabled : {})
        }}
        // Chỉ cho phép chọn nếu slot còn trống
        onClick={() =>
          slot.isAvailable !== false && setSelectedTimeSlot(slot)
        }
      >
        {slot.time
          ? slot.time
          : `${slot.start_time || ''}${slot.end_time ? ' - ' + slot.end_time : ''}`}
        {slot.isAvailable === false && (
          <span style={{ color: '#e74c3c', fontSize: 12, marginLeft: 6 }}>
            (Đã đặt)
          </span>
        )}
      </div>
    ))
  ) : (
    <span style={{ color: '#888' }}>Không có slot nào</span>
  )}
</div>


              </div>
            </div>
            {/* Action Button */}
            <div style={{ width: '100%', margin: '0 auto' }}>
              <div style={styles.actionButtons}>
                <button style={styles.btnBookNow} onClick={handleBooking}>
                  Đặt lịch ngay
                </button>
              </div>
              <div
                style={{
                  color: '#e74c3c',
                  fontWeight: 500,
                  marginTop: 10,
                  textAlign: 'center'
                }}
              >
                Bạn cần thanh toán cọc 30% phí để đặt lịch
              </div>
            </div>


          </div>
        </div>
        {/* Detail Tabs */}
        <div style={styles.detailTabs}>
          <div style={styles.tabHeaders}>
            <button
              style={{
                ...styles.tabHeader,
                ...(activeTab === 'description' ? styles.tabHeaderActive : {})
              }}
              onClick={() => setActiveTab('description')}
            >
              Mô tả dịch vụ
            </button>
          </div>
          <div style={styles.tabContent}>
            {activeTab === 'description' && (
              <div>
                <h3>Mô tả dịch vụ</h3>
                <div
                  style={{ fontSize: 16, color: '#333' }}
                  dangerouslySetInnerHTML={{
                    __html: (service.description || '')
                      .replace(/\n/g, '<br/>')
                      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
                  }}
                />
                {service.features && service.features.length > 0 && (
                  <>
                    <h4>Đặc điểm nổi bật:</h4>
                    <ul>
                      {service.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
        {showBookingModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.3)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setShowBookingModal(false)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                width: 900,
                maxWidth: '98vw',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                overflow: 'hidden',
                minHeight: 420,
                position: 'relative'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Tiêu đề modal */}
              <div
                style={{
                  width: '100%',
                  padding: '22px 0 10px 0',
                  textAlign: 'center',
                  borderBottom: '1px solid #eee',
                  background: '#f8f9fa'
                }}
              >
                <span style={{ fontSize: 26, fontWeight: 700, color: '#007bff', letterSpacing: 1 }}>
                  Đặt lịch khám bệnh
                </span>
              </div>
              {/* Nội dung chia 2 cột */}
              <div style={{ display: 'flex', width: '100%', flex: 1 }}>
                {/* Bên trái: Thông tin dịch vụ, bác sĩ, phòng khám, thời gian */}
                <div style={{ flex: 1.2, padding: 32, borderRight: '1px solid #eee', background: '#f8f9fa' }}>
                  <h3 style={{ color: '#007bff', marginBottom: 18 }}>Thông tin dịch vụ</h3>

                  <div style={{ width: '100%', marginBottom: 20, textAlign: 'center' }}>
                    <img
                      src={mainImage || '/no-image.jpg'}
                      alt={service?.serviceName || service?.name}
                      style={{ width: 140, height: 110, objectFit: 'cover', borderRadius: 8, boxShadow: '0 1px 8px #ccc' }}
                    />
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Tên dịch vụ: </span>
                    <span>{service?.serviceName || '---'}</span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontWeight: 600 }}>Giá dịch vụ: </span>
                    <span style={{ color: '#e74c3c', fontWeight: 700, fontSize: 20 }}>
                      {getCurrentPrice().toLocaleString()} đ
                    </span>
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Gói dịch vụ nhỏ : </span>
                    <span>{currentOption ? currentOption.optionName : "---"}</span>

                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Bác sĩ: </span>
                    <span>{service?.doctorId?.userId?.fullname || '---'}</span>
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Phòng khám: </span>
                    <span>{service?.clinicId?.clinic_name || '---'}</span>
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Ngày khám: </span>
                    <span>{selectedDate}</span>
                  </div>
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontWeight: 600 }}>Khung giờ: </span>
                    <span>
                      {selectedTimeSlot?.start_time && selectedTimeSlot?.end_time
                        ? `${selectedTimeSlot.start_time} - ${selectedTimeSlot.end_time}`
                        : selectedTimeSlot?.time || selectedTimeSlot || '---'}
                    </span>

                  </div>
                  <div style={{ marginTop: 10, marginBottom: 16 }}>
                    <span style={{ color: '#e74c3c', fontWeight: 600 }}>
                      Vui lòng kiểm tra kỹ thông tin trước khi thanh toán. Nếu bạn hủy lịch sau khi thanh toán, hệ thống sẽ giữ lại 10% tiền cọc.
                    </span>
                  </div>

                </div>
                {/* Bên phải: Thông tin người đặt */}
                <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ color: '#007bff', marginBottom: 18 }}>Thông tin người đặt</h3>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>Họ và tên</label>
                      <input
                        type="text"
                        value={user?.fullname || ''}
                        readOnly
                        style={{
                          width: '100%',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          padding: '10px 14px',
                          background: '#fafbfc'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>Ngày sinh</label>
                      <input
                        type="text"
                        value={formatDateOfBirth(user?.dateOfBirth) || ''}
                        readOnly
                        style={{
                          width: '100%',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          padding: '10px 14px',
                          background: '#fafbfc'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        style={{
                          width: '100%',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          padding: '10px 14px',
                          background: '#fafbfc'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>Số điện thoại</label>
                      <input
                        type="text"
                        value={user?.phone || ''}
                        readOnly
                        style={{
                          width: '100%',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          padding: '10px 14px',
                          background: '#fafbfc'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>Địa chỉ</label>
                      <input
                        type="text"
                        value={user?.address || ''}
                        readOnly
                        style={{
                          width: '100%',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          padding: '10px 14px',
                          background: '#fafbfc'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#34495e' }}>Ghi chú</label>
                      <textarea
                        value={note || ''}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Ghi chú thêm (nếu có)..."
                        style={{
                          width: '100%',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          padding: '10px 14px',
                          background: '#fafbfc',
                          minHeight: 40
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#34495e' }}>
                        Tải lên file bệnh án trước đó (nếu có)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Nút chọn file custom */}
                        <label
                          htmlFor="file-upload"
                          style={{
                            background: '#f1f3f6',
                            color: '#007bff',
                            padding: '10px 22px',
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: '1.5px solid #007bff',
                            transition: 'all 0.2s',
                            display: 'inline-block'
                          }}
                          onMouseOver={e => (e.target.style.background = '#e6f0ff')}
                          onMouseOut={e => (e.target.style.background = '#f1f3f6')}
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
                        {/* Nút tải lên */}
                        <button
                          onClick={handleFileUpload}
                          disabled={!file}
                          style={{
                            background: file ? '#007bff' : '#b2c6e6',
                            color: '#fff',
                            padding: '10px 28px',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 16,
                            cursor: file ? 'pointer' : 'not-allowed',
                            boxShadow: file ? '0 1px 6px #007bff22' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          <i className="fa fa-cloud-upload" style={{ marginRight: 8 }}></i>
                          Tải lên
                        </button>
                      </div>
                      {/* Hiển thị tên file đã chọn */}
                      {fileName && (
                        <div style={{ fontSize: 14, color: '#007bff', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fa fa-file" style={{ fontSize: 16 }}></i>
                          <span>Đã chọn: {fileName}</span>
                        </div>
                      )}
                      {/* Hiển thị thông báo upload thành công */}
                      {fileUrl && (
                        <div style={{ color: 'green', marginTop: 8, fontWeight: 600 }}>
                          <i className="fa fa-check-circle" style={{ marginRight: 6 }}></i>
                          File đã upload thành công!
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 10, marginBottom: 16 }}>
                      <span style={{ color: '#e74c3c', fontWeight: 600 }}>
                        Số tiền bạn cần cọc trước 30% là: {depositAmount.toLocaleString()}  VND
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: 18 }}>
                    <button
                      style={{
                        background: '#e74c3c',
                        color: '#fff',
                        padding: '14px 38px',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 18,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px #e74c3c33'
                      }}
                      onClick={handlePayment}
                    >
                      Thanh toán ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



      </div>

    </div>
  );
};

export default ServiceDetail;
