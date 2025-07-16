import React, { useEffect, useState } from "react";
import { Container, Row, Col, Form, FormControl, Pagination } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import "../assets/css/DoctorPage.css";

const DoctorPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 5; // 5 doctors per page to fit the 6-card layout (1 for appointment card)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get("http://localhost:9999/api/doctor");
        setDoctors(res.data.data || []);
        console.log("Doctors API Response:", res.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };

    fetchDoctors();
  }, []);

  // Handle search input change
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Filter doctors based on search query and status
  const filteredDoctors = doctors
    .filter((doctor) => {
      const fullName = doctor.userId?.fullname || "";
      const specialty = doctor.Specialty || "";
      const query = searchQuery.toLowerCase();
      return (
        fullName.toLowerCase().includes(query) ||
        specialty.toLowerCase().includes(query)
      );
    })
    .filter((doctor) => doctor.Status !== "inactive");

  // Calculate pagination
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(indexOfFirstDoctor, indexOfLastDoctor);
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="doctor-page">
      {/* Hero Section */}
      <div id="heroCarousel" className="carousel slide carousel-fade" data-bs-ride="carousel" data-bs-interval="4000">
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img
              src="https://seadent.com.vn/wp-content/uploads/2021/12/y-si-nha-khoa-co-duoc-mo-phong-kham-khong.jpg"
              className="d-block w-100"
              alt="Dentist Banner"
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
              <h1 className="display-3 fw-bold text-white mb-3">Đội ngũ bác sĩ</h1>
              <p className="text-white fs-5">Gặp gỡ các bác sĩ có tay nghề và kinh nghiệm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="container-fluid py-5">
        <Container>
          {/* Search Bar */}
          <Row className="mb-5">
            <Col md={6} className="mx-auto">
              <Form>
                <FormControl
                  type="text"
                  placeholder="Tìm kiếm bác sĩ theo tên hoặc chuyên ngành..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="doctor-search-input"
                />
              </Form>
            </Col>
          </Row>

          <Row className="g-4">
            {/* Text Section (only on first page) */}
            {currentPage === 1 && (
              <Col lg={4} md={6} className="doctor-card-col">
                <div className="team-header bg-light rounded p-5">
                  <h5 className="text-primary text-uppercase position-relative d-inline-block">
                    Đội ngũ bác sĩ
                    <span className="team-header-underline"></span>
                  </h5>
                  <h1 className="display-6 mb-4">
                    Gặp gỡ các bác sĩ có tay nghề và kinh nghiệm
                  </h1>
                  <Link
                    to="/appointment"
                    className="btn btn-primary py-3 px-4 d-flex align-items-center justify-content-center"
                  >
                    <i className="bi bi-calendar3 me-2"></i>
                    ĐẶT LỊCH KHÁM NGAY!
                  </Link>
                </div>
              </Col>
            )}

            {/* Doctor Cards */}
            {currentDoctors.map((doctor, index) => (
              <Col
                lg={4}
                md={6}
                key={doctor._id}
                className="doctor-card-col"
                data-wow-delay={`${(index % 3) * 0.3}s`}
              >
                <div className="doctor-card">
                  <div className="doctor-card-image">
                    <img
                      src={doctor.ProfileImage || "https://via.placeholder.com/300x200"}
                      alt={doctor.userId?.fullname || "Doctor"}
                      onError={(e) => (e.target.src = "https://via.placeholder.com/300x200")}
                    />
                  </div>
                  <div className="doctor-card-content">
                    <h4 className="doctor-card-title">
                      {doctor.userId ? `Bác sĩ ${doctor.userId.fullname}` : "Bác sĩ không rõ tên"}
                    </h4>
                    <p className="doctor-card-specialty">
                      <strong>Chuyên ngành:</strong> {doctor.Specialty || "Không rõ"}
                    </p>
                    <p className="doctor-card-clinic">
                      <strong>Phòng khám:</strong> {doctor.clinic_id?.clinic_name || "Không rõ"}
                    </p>
                    <Link
                      to={`/doctor/${doctor._id}`}
                      className="btn btn-outline-primary mt-2"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Row className="mt-5">
              <Col className="d-flex justify-content-center">
                <Pagination>
                  <Pagination.Prev
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages)].map((_, index) => (
                    <Pagination.Item
                      key={index + 1}
                      active={index + 1 === currentPage}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    </div>
  );
};

export default DoctorPage;