import React from 'react';
import HeaderComponent from "../components/HeaderComponent";
import FooterComponent from "../components/FooterComponent";
import MilestoneSection from "../components/MilestoneSection";
import { Row, Col } from "react-bootstrap";

const AboutPage = () => {
  return (
    <>
      {/* Topbar */}
      <div className="bg-light py-3 px-5 d-none d-lg-block border-bottom shadow-sm">
        <Row className="align-items-center justify-content-between">
          <Col md={6} className="text-start">
            <small className="text-muted">
              <i className="far fa-clock text-primary me-2"></i>
              Opening Hours: Mon - Tues : 6.00 am - 10.00 pm, Sunday Closed
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
      </div>

      

      {/* Hero Section */}
      <div id="heroCarousel" className="carousel slide carousel-fade" data-bs-ride="carousel" data-bs-interval="4000">
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img
              src="https://mcohome.vn/wp-content/uploads/2023/03/z4146608990086_40d02c3b4e3dce3f26a1857fca47d952.jpg"
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
              <h1 className="display-3 fw-bold text-white mb-3">Giới Thiệu Phòng Khám</h1>
              <p className="text-white fs-5">Mang lại nụ cười rạng rỡ với dịch vụ nha khoa chất lượng cao</p>
            </div>
          </div>
        </div>
      </div>

      {/* Giới thiệu nội dung */}
      <div className="container py-5">

        {/* Section 1 - Giới thiệu + ảnh */}
        <section className="mb-5">
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0">
              <img
                src="https://bambufit.vn/images/image/nhakhoavietsing3.jpg"
                alt="Nha Khoa Việt Hàn"
                className="img-fluid rounded shadow-lg"
                style={{ transition: 'transform 0.3s ease', transform: 'scale(1)' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>
            <div className="col-md-6">
              <h2 className="text-primary fw-bold mb-3">Nha Khoa DentistEZ</h2>
              <p className="text-muted mb-4 fs-5">
                Kể từ khi thành lập vào năm 2021, DentistEZ luôn cam kết giữ vững và phát huy những giá trị cốt lõi: chất lượng – chuyên môn – tận tâm. Đội ngũ bác sĩ tại DentistEZ đều tốt nghiệp chính quy ngành Răng Hàm Mặt từ các trường đại học y khoa hàng đầu tại Việt Nam như Đại học Y Dược TP. Hồ Chí Minh, Đại học Y Dược Hà Nội, và Đại học Y Dược Huế. Với nhiều năm kinh nghiệm và tinh thần học hỏi không ngừng, các bác sĩ không chỉ giỏi chuyên môn mà còn luôn tận tâm, đề cao y đức, mang đến sự an tâm và hài lòng cho mọi khách hàng – từ trong nước đến quốc tế.
              </p>
              <div className="row text-primary fw-semibold">
                <div className="col-6 mb-3"><i className="fa fa-check-circle text-primary me-2"></i>Trồng răng Implant</div>
                <div className="col-6 mb-3"><i className="fa fa-check-circle text-primary me-2"></i>Niềng răng thẩm mỹ</div>
                <div className="col-6 mb-3"><i className="fa fa-check-circle text-primary me-2"></i>Phục hình răng sứ</div>
                <div className="col-6 mb-3"><i className="fa fa-check-circle text-primary me-2"></i>Nhổ răng khôn</div>
                <div className="col-6 mb-3"><i className="fa fa-check-circle text-primary me-2"></i>Nha khoa tổng quát</div>
              </div>
            </div>
          </div>
        </section>

        <MilestoneSection />

        {/* Section 2 - Cơ sở vật chất */}
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

        {/* Section 3 - Cam Kết */}
        <section className="mb-5">
          <h3 className="text-primary mb-4 fw-bold text-center">Cam Kết Dịch Vụ</h3>
          <div className="row text-center">
            <div className="col-md-4 mb-4">
              <div className="p-4 rounded shadow-sm bg-light" style={{ transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="fa fa-check-circle fa-2x text-primary mb-3"></i>
                <h5 className="fw-bold text-primary">Chất Lượng Điều Trị</h5>
                <p className="text-muted fs-6">Luôn đảm bảo quy trình điều trị chuẩn y khoa và an toàn tuyệt đối cho khách hàng.</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="p-4 rounded shadow-sm bg-light" style={{ transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="fa fa-smile-beam fa-2x text-primary mb-3"></i>
                <h5 className="fw-bold text-primary">Khách Hàng Là Trung Tâm</h5>
                <p className="text-muted fs-6">Luôn lắng nghe và phục vụ khách hàng bằng tất cả sự tận tâm và chuyên nghiệp.</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="p-4 rounded shadow-sm bg-light" style={{ transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="fa fa-tools fa-2x text-primary mb-3"></i>
                <h5 className="fw-bold text-primary">Cơ Sở Vật Chất Hiện Đại</h5>
                <p className="text-muted fs-6">Liên tục cập nhật công nghệ và trang thiết bị tiên tiến nhất hiện nay.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <FooterComponent />
    </>
  );
};

export default AboutPage;