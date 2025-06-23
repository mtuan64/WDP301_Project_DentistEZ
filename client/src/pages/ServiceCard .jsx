import React from 'react';
import axios from 'axios';
import { Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';


const ServiceCard = () => {
  const [services, setServices] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [hoveredCard, setHoveredCard] = React.useState(null);

  // Phân trang
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(4);

  // Fetch dữ liệu từ API
  React.useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://localhost:9999/api/view/service');
        setServices(res.data.data || res.data);
      } catch (err) {
        setError('Không thể tải danh sách dịch vụ');
        setServices([]);
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  // Khi đổi số dòng/trang thì về trang 1
  React.useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  // Phân trang
  const totalServices = services.length;
  const totalPages = Math.ceil(totalServices / rowsPerPage);

  const getPaginatedServices = () => {
    const startIdx = (page - 1) * rowsPerPage;
    return services.slice(startIdx, startIdx + rowsPerPage);
  };

  const styles = {
    servicePage: {
      width: '100%',
      backgroundColor: '#f8f9fa'
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
    },
    servicesContainer: {
      padding: '0 20px 40px 20px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    servicesTitle: {
      fontSize: '28px',
      fontWeight: '600',
      color: '#2c3e50',
      textAlign: 'center',
      marginBottom: '30px'
    },
    servicesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      justifyItems: 'center'
    },
    serviceCardSimple: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      maxWidth: '300px',
      width: '100%',
      cursor: 'pointer',
      border: '1px solid #e9ecef'
    },
    serviceCardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
    },
    serviceImage: {
      width: '100%',
      height: '200px',
      overflow: 'hidden'
    },
    serviceImageImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.3s ease'
    },
    serviceInfo: {
      padding: '20px'
    },
    serviceName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#2c3e50',
      margin: 0,
      textAlign: 'center',
      lineHeight: '1.4'
    }
  };

  return (
    <div style={styles.servicePage}>
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
          onError={(e) => {
            e.target.src = '/api/placeholder/1200/300'; // Fallback image
          }}
        />
      </div>

      {/* Services Grid */}
      <div style={styles.servicesContainer}>
        <h3 style={styles.servicesTitle}>Danh Sách Dịch Vụ</h3>
        <div style={styles.servicesGrid}>
          {loading ? (
            <div>Đang tải...</div>
          ) : error ? (
            <div style={{ color: 'red', textAlign: 'center', width: '100%' }}>{error}</div>
          ) : getPaginatedServices().length === 0 ? (
            <div style={{ textAlign: 'center', width: '100%' }}>Không có dịch vụ nào!</div>
          ) : (
            getPaginatedServices().map((serviceItem, index) => (
              <div
                key={serviceItem._id}
                style={{
                  ...styles.serviceCardSimple,
                  ...(hoveredCard === index ? styles.serviceCardHover : {})
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Service Image */}
                <Link
                  to={`/service-detail/${serviceItem._id}`}
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={styles.serviceImage}>
                    <img
                      src={serviceItem.image || '/api/placeholder/300/200'}
                      alt={serviceItem.serviceName || serviceItem.name || 'Service'}
                      style={{
                        ...styles.serviceImageImg,
                        transform: hoveredCard === index ? 'scale(1.05)' : 'scale(1)'
                      }}
                    />
                  </div>
                </Link>

                {/* Service Name */}
                <div style={styles.serviceInfo}>
                  <h3 style={styles.serviceName}>{serviceItem.serviceName || serviceItem.name}</h3>
                </div>
              </div>
            ))
          )}
        </div>

        {/* PHÂN TRANG */}
        {totalPages >= 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '32px 0 0 0'
          }}>
            <div style={{
              display: 'flex',
              gap: 8,
              background: '#fff',
              borderRadius: 32,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              padding: '8px 24px'
            }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: page === 1 ? '#e0e0e0' : '#bdbdbd',
                  fontSize: 20,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
                onClick={() => setPage(1)}
                disabled={page === 1}
                title="Trang đầu"
              >&#171;</button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: page === 1 ? '#e0e0e0' : '#bdbdbd',
                  fontSize: 20,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                title="Trang trước"
              >&#8249;</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n =>
                  n === 1 ||
                  n === totalPages ||
                  (n >= page - 1 && n <= page + 1)
                )
                .map((n, idx, arr) => (
                  <React.Fragment key={n}>
                    {idx > 0 && n - arr[idx - 1] > 1 && (
                      <span style={{ width: 32, textAlign: 'center', color: '#bdbdbd' }}>...</span>
                    )}
                    <button
                      style={{
                        background: page === n ? '#00bcd4' : 'none',
                        color: page === n ? '#fff' : '#bdbdbd',
                        fontWeight: page === n ? 'bold' : 600,
                        border: 'none',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                        fontSize: 20,
                        cursor: page === n ? 'default' : 'pointer',
                        pointerEvents: page === n ? 'none' : 'auto',
                        transition: 'background 0.15s, color 0.15s'
                      }}
                      onClick={() => setPage(n)}
                      disabled={page === n}
                    >
                      {n}
                    </button>
                  </React.Fragment>
                ))}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: page === totalPages ? '#e0e0e0' : '#bdbdbd',
                  fontSize: 20,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer'
                }}
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                title="Trang sau"
              >&#8250;</button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: page === totalPages ? '#e0e0e0' : '#bdbdbd',
                  fontSize: 20,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer'
                }}
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                title="Trang cuối"
              >&#187;</button>
            </div>
          </div>

        )}
      </div>
      
    </div>
  );
};

export default ServiceCard;
