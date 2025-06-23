import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import MilestoneSection from "../components/MilestoneSection";
import "../assets/css/HomePage.css";

const HomePage = () => {
  // State for blogs and loading
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);


  // Fetch Doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get("http://localhost:9999/api/doctor");
        setDoctors(
          response.data.data.filter((doctor) => doctor.Status !== "inactive")
        );
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const blogsResponse = await axios.get("http://localhost:9999/api/blogs", {
          headers,
        });

        // Transform content if it's a string or missing
        const transformedBlogs = blogsResponse.data.map((blog) => ({
          ...blog,
          content: Array.isArray(blog.content)
            ? blog.content
            : [
              {
                type: "paragraph",
                text: blog.content || "No content available",
              },
            ],
        }));

        // Sort blogs by creation date (newest first)
        const sortedBlogs = transformedBlogs.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setBlogs(sortedBlogs);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Utility functions from BlogPage
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength - 3) + "...";
  };

  const getContentSummary = (content) => {
    if (!Array.isArray(content) || content.length === 0)
      return "No content available";
    const firstItem = content[0];
    return truncateText(firstItem.text, 100);
  };

  // Filter active doctors
  const activeDoctors = doctors.filter((doctor) => doctor.Status !== "inactive");

  // Handle carousel navigation
  const handleNext = () => {
    setCarouselIndex((prevIndex) => (prevIndex + 1) % activeDoctors.length);
  };

  const handlePrev = () => {
    setCarouselIndex((prevIndex) =>
      prevIndex === 0 ? activeDoctors.length - 1 : prevIndex - 1
    );
  };

  // Get the doctors to display based on carouselIndex
  const getVisibleDoctors = () => {
    const visibleDoctors = [];
    for (let i = 0; i < 4; i++) {
      const index = (carouselIndex + i) % activeDoctors.length;
      visibleDoctors.push(activeDoctors[index]);
    }
    return visibleDoctors;
  };

  return (
    <>

      {/* Hero Carousel */}
      <div
        id="heroCarousel"
        className="carousel slide carousel-fade"
        data-bs-ride="carousel"
      >
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img
              src="https://govi.vn/wp-content/uploads/2022/03/tai-sao-can-phai-co-thiet-ke-nha-khoa-an-tuong.jpg"
              className="d-block w-100"
              alt="Dental Banner"
              style={{ objectFit: "cover", height: "90vh" }}
            />
            <div
              className="carousel-caption d-flex flex-column justify-content-center align-items-center text-center"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: "0 15px",
              }}
            >
              <div className="text-white">
                <h5
                  className="text-uppercase fw-semibold mb-3"
                  style={{ letterSpacing: "2px" }}
                >
                  Keep Your Teeth Healthy
                </h5>
                <h1 className="display-3 fw-bold mb-4">
                  Take The Best Quality Dental Treatment
                </h1>
                <div>
                  <Link
                    to="/appointment"
                    className="btn btn-primary btn-lg px-4 me-3 shadow"
                  >
                    Appointment
                  </Link>
                  <Link
                    to="/contact"
                    className="btn btn-outline-light btn-lg px-4 shadow"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Us */}
      <Container className="py-5">
        <Row className="align-items-center">
          <Col md={6} className="mb-4 mb-md-0">
            <img
              src="https://mcohome.vn/wp-content/uploads/2023/03/z4146608990086_40d02c3b4e3dce3f26a1857fca47d952.jpg"
              alt="Nha Khoa Việt Hàn"
              className="img-fluid rounded shadow-lg"
              style={{ transition: "transform 0.3s ease", transform: "scale(1)" }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            />
          </Col>
          <Col md={6}>
            <h2 className="text-primary fw-bold mb-3">Nha Khoa DentistEZ</h2>
            <p className="text-muted mb-4 fs-5">
              Nha Khoa DentistEZ là một trong những phòng khám nha khoa uy tín với đội ngũ bác sĩ và chuyên gia được đào tạo bài bản tại các trường đại học danh tiếng trong và ngoài nước. Chúng tôi tự hào thực hiện thành công nhiều kỹ thuật nha khoa phức tạp, đáp ứng các tiêu chuẩn nghiêm ngặt theo quy chuẩn quốc tế.
              Với cam kết không ngừng nâng cao chất lượng dịch vụ, DentistEZ mong muốn trở thành người bạn đồng hành tin cậy, mang đến trải nghiệm chăm sóc răng miệng an toàn, chuyên nghiệp và đẳng cấp cho tất cả khách hàng.
            </p>
            {/* <Row className="text-primary fw-semibold">
              <Col xs={6} className="mb-3">
                <i className="fa fa-check-circle text-primary me-2"></i>Trồng
                răng Implant
              </Col>
              <Col xs={6} className="mb-3">
                <i className="fa fa-check-circle text-primary me-2"></i>Niềng
                răng thẩm mỹ
              </Col>
              <Col xs={6} className="mb-3">
                <i className="fa fa-check-circle text-primary me-2"></i>Phục hình
                răng sứ
              </Col>
              <Col xs={6} className="mb-3">
                <i className="fa fa-check-circle text-primary me-2"></i>Nhổ răng
                khôn
              </Col>
              <Col xs={6} className="mb-3">
                <i className="fa fa-check-circle text-primary me-2"></i>Nha khoa
                tổng quát
              </Col>
            </Row> */}
          </Col>
        </Row>
      </Container>

      {/* Tiêu chí phòng khám */}
      <MilestoneSection />

      {/* Cơ sở vật chất */}
      <section className="mb-5">
        <h3 className="text-primary mb-4 fw-bold text-center">Cơ Sở Vật Chất</h3>
        <div id="facilityCarousel" className="carousel slide carousel-fade" data-bs-ride="carousel" data-bs-interval="3000">
          <div className="carousel-indicators">
            <button
              type="button"
              data-bs-target="#facilityCarousel"
              data-bs-slide-to="0"
              className="active"
              aria-current="true"
              aria-label="Slide 1"
            ></button>
            <button
              type="button"
              data-bs-target="#facilityCarousel"
              data-bs-slide-to="1"
              aria-label="Slide 2"
            ></button>
            <button
              type="button"
              data-bs-target="#facilityCarousel"
              data-bs-slide-to="2"
              aria-label="Slide 3"
            ></button>
          </div>
          <div className="carousel-inner">
            <div className="carousel-item active">
              <img
                src="https://binbadecor.vn/wp-content/uploads/2020/06/10-mau-phong-kham-nha-khoa-dep-nhat.jpg"
                className="d-block w-100"
                alt="Máy chụp X-quang kỹ thuật số"
                style={{ objectFit: 'cover', height: '50vh', borderRadius: '8px' }}
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
                  borderRadius: '8px',
                  padding: '20px'
                }}
              >
                <h4 className="text-white fw-bold mb-3">Trang Thiết Bị Hiện Đại</h4>
                <p className="text-white text-center fs-6">
                  Máy chụp X-quang kỹ thuật số tiên tiến, đảm bảo hình ảnh rõ nét và chẩn đoán chính xác.
                </p>
              </div>
            </div>
            <div className="carousel-item">
              <img
                src="https://seadent.com.vn/wp-content/uploads/2022/01/mo-phong-kham-nha-khoa.jpg"
                className="d-block w-100"
                alt="Ghế điều trị đa năng"
                style={{ objectFit: 'cover', height: '50vh', borderRadius: '8px' }}
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
                  borderRadius: '8px',
                  padding: '20px'
                }}
              >
                <h4 className="text-white fw-bold mb-3">Ghế Điều Trị Đa Năng</h4>
                <p className="text-white text-center fs-6">
                  Ghế nha khoa hiện đại, tích hợp công nghệ cao, mang lại sự thoải mái tối đa cho khách hàng.
                </p>
              </div>
            </div>
            <div className="carousel-item">
              <img
                src="https://anviethouse.vn/wp-content/uploads/2021/07/Mau-thiet-ke-phong-kham-nha-khoa-1-3.png"
                className="d-block w-100"
                alt="Phòng vô trùng"
                style={{ objectFit: 'cover', height: '50vh', borderRadius: '8px' }}
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
                  borderRadius: '8px',
                  padding: '20px'
                }}
              >
                <h4 className="text-white fw-bold mb-3">Phòng Vô Trùng</h4>
                <p className="text-white text-center fs-6">
                  Đáp ứng tiêu chuẩn y tế nghiêm ngặt, đảm bảo an toàn tuyệt đối trong mọi quy trình điều trị.
                </p>
              </div>
            </div>
          </div>
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#facilityCarousel"
            data-bs-slide="prev"
          >
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#facilityCarousel"
            data-bs-slide="next"
          >
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </section>

      {/* Latest Blog */}
      <Container className="py-5">
        <h2 className="text-center mb-4 fw-bold text-primary">Các bài viết mới</h2>
        {loading ? (
          <p>Loading blogs...</p>
        ) : blogs.length === 0 ? (
          <p>No blogs available.</p>
        ) : (
          <Row>
            {blogs.slice(0, 3).map((blog, index) => (
              <Col lg={4} key={blog.id} className="mb-4">
                <div
                  className="blog-item bg-light rounded shadow"
                  data-wow-delay={`${0.1 + index * 0.2}s`}
                >
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="img-fluid rounded-top"
                    style={{ height: "220px", objectFit: "cover" }}
                  />
                  <div className="p-3">
                    <h5>{blog.title}</h5>
                    <p>{getContentSummary(blog.content)}</p>
                    <Link to={`/blog/${blog.slug}`} className="btn btn-primary">
                      Read More
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Services Section */}
      <Container fluid className="bg-light py-5">
        <Container>
          <h2 className="text-center text-primary fw-bold mb-5">
            Các loại dịch vụ
          </h2>
          <Row>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Col md={4} lg={2} key={item} className="mb-4">
                <div className="service-item bg-white shadow rounded p-4 text-center">
                  <i className="fa fa-tooth fa-3x text-primary mb-3"></i>
                  <h5>Service {item}</h5>
                  <p className="text-muted">
                    Description of Service {item} goes here.
                  </p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </Container>

      {/* Our Doctors */}
      <Container className="py-5">
        <h2 className="text-center mb-4 fw-bold text-primary">Đội ngũ bác sĩ</h2>
        {loadingDoctors ? (
          <p>Loading doctors...</p>
        ) : activeDoctors.length === 0 ? (
          <p>No doctors available.</p>
        ) : activeDoctors.length <= 4 ? (
          <Row>
            {activeDoctors.map((doctor) => (
              <Col key={doctor._id} lg={3} md={6} sm={12} className="mb-4">
                <div
                  className="bg-light rounded shadow h-100"
                  style={{ overflow: "hidden" }}
                >
                  <img
                    src={doctor.ProfileImage}
                    alt={doctor.userId?.fullname || "Doctor"}
                    className="img-fluid w-100"
                    style={{ height: "250px", objectFit: "cover" }}
                  />
                  <div className="p-3 text-center">
                    <h5 className="mb-1">
                      {doctor.userId
                        ? `Bác sĩ ${doctor.userId.fullname}`
                        : "Bác sĩ không rõ tên"}
                    </h5>
                    <p className="text-muted mb-2">
                      <strong>Chuyên ngành:</strong>{" "}
                      {doctor.Specialty || "Không rõ"}
                    </p>
                    <Link
                      to={`/doctor/${doctor._id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="doctors-carousel">
            <Row className="flex-nowrap doctors-carousel-inner">
              {getVisibleDoctors().map((doctor) => (
                <Col key={doctor._id} lg={3} md={6} sm={12} className="mb-4">
                  <div
                    className="bg-light rounded shadow h-100"
                    style={{ overflow: "hidden" }}
                  >
                    <img
                      src={doctor.ProfileImage}
                      alt={doctor.userId?.fullname || "Doctor"}
                      className="img-fluid w-100"
                      style={{ height: "250px", objectFit: "cover" }}
                    />
                    <div className="p-3 text-center">
                      <h5 className="mb-1">
                        {doctor.userId
                          ? `Bác sĩ ${doctor.userId.fullname}`
                          : "Bác sĩ không rõ tên"}
                      </h5>
                      <p className="text-muted mb-2">
                        <strong>Chuyên ngành:</strong>{" "}
                        {doctor.Specialty || "Không rõ"}
                      </p>
                      <Link
                        to={`/doctor/${doctor._id}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
            <button
              className="carousel-control-prev"
              type="button"
              onClick={handlePrev}
            >
              <span
                className="carousel-control-prev-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              onClick={handleNext}
            >
              <span
                className="carousel-control-next-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        )}
      </Container>
    </>
  );
};

export default HomePage;