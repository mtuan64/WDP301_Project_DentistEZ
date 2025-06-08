import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import HeaderComponent from "../components/HeaderComponent";
import FooterComponent from "../components/FooterComponent";
import axios from "axios";
import "../assets/css/HomePage.css";

const DoctorPage = () => {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get("http://localhost:9999/api/doctor");
        setDoctors(res.data.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };

    fetchDoctors();
  }, []);

  return (
    <>
      {/* Topbar */}
      <div className="bg-light py-2 px-5 d-none d-lg-block">
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

      

      {/* Hero Carousel */}
      <div id="heroCarousel" className="carousel slide carousel-fade" data-bs-ride="carousel">
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img
              src="https://toplist.vn/images/800px/nha-khoa-lac-viet-intech-926275.jpg"
              className="d-block w-100"
              alt="Dentist Banner"
              style={{ objectFit: 'cover', height: '80vh' }}
            />
            <div
              className="carousel-caption d-flex flex-column justify-content-center align-items-center"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                position: 'absolute'
              }}
            >
              <div className="text-center text-white">
                <h1 className="display-3 fw-bold">Our Dentists</h1>
                <p className="lead mt-3">Trusted professionals for your perfect smile</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Team Section */}
      <div className="container-fluid py-5">
        <Container>
          <Row className="g-5">
            <Col lg={4} className="wow fadeInUp" data-wow-delay="0.1s">
              <div className="bg-light rounded h-100 p-5">
                <h5 className="text-primary text-uppercase position-relative d-inline-block">
                  Our Dentist
                  <span
                    className="position-absolute top-0 start-0 translate-middle-y bg-primary w-100"
                    style={{ height: "2px" }}
                  ></span>
                </h5>
                <h1 className="display-6 mb-4">Meet Our Certified & Experienced Dentist</h1>
                <Link to="/appointment" className="btn py-3 px-4 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#005B99', color: 'white', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  <i className="bi bi-calendar3 me-2"></i>
                  ĐẶT LỊCH KHÁM NGAY!
                </Link>
              </div>
            </Col>

            {doctors.map((doctor, index) => (
              <Col
                lg={4}
                key={doctor._id}
                className="wow fadeInUp"
                data-wow-delay={`${(index % 3) * 0.3}s`}
              >
                <div className="team-item">
                  <div className="position-relative rounded-top">
                    <img
                      className="img-fluid rounded-top w-100"
                      src={doctor.ProfileImage}
                      alt={doctor.userId ? doctor.userId.fullname : 'Doctor'}
                    />
                  </div>
                  <div className="team-text position-relative bg-light text-center rounded-bottom p-4 pt-5">
                    <h4 className="mb-2">
                      {doctor.userId ? `Bác sĩ ${doctor.userId.fullname}` : 'Bác sĩ không rõ tên'}
                    </h4>
                    <p className="mb-2">
                      <strong>Chuyên ngành:</strong> {doctor.Specialty || 'Không rõ'}
                    </p>
                    <Link to={`/doctor/${doctor._id}`} className="btn btn-primary mt-2">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </Col>
            ))}



          </Row>
        </Container>
      </div>

    </>
  );
};

export default DoctorPage;