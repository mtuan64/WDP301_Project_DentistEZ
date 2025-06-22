import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  HomeOutlined,
  InfoCircleOutlined,
  BookOutlined,
  ToolOutlined,
  TeamOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  TwitterOutlined,
  FacebookOutlined,
  LinkedinOutlined,
  InstagramOutlined,
} from "@ant-design/icons";

const FooterComponent = () => {
  return (
    <footer className="bg-dark text-light pt-5">
      <Container>
        <Row className="pt-4">
          <Col lg={3} md={6} className="mb-4" style={{ paddingRight: "20px", paddingLeft: "20px" }}>
            <h5 className="text-white mb-4">Giới Thiệu Về DentistEZ</h5>
            <p className="text-light">
              DentistEZ là phòng khám nha khoa uy tín, cung cấp dịch vụ chất lượng cao với sự tập trung vào sự thoải mái của bệnh nhân và các phương pháp điều trị tiên tiến. Đội ngũ giàu kinh nghiệm của chúng tôi cam kết mang đến nụ cười rạng rỡ cho bạn.
            </p>
          </Col>
          <Col lg={3} md={6} className="mb-4" style={{ paddingRight: "20px", paddingLeft: "20px" }}>
            <h5 className="text-white mb-4">Liên Kết Phổ Biến</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/" className="text-light d-flex align-items-center">
                  <HomeOutlined className="me-2" />
                  Trang Chủ
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-light d-flex align-items-center">
                  <InfoCircleOutlined className="me-2" />
                  Về Chúng Tôi
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-light d-flex align-items-center">
                  <BookOutlined className="me-2" />
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/service" className="text-light d-flex align-items-center">
                  <ToolOutlined className="me-2" />
                  Dịch Vụ
                </Link>
              </li>
              <li>
                <Link to="/doctor" className="text-light d-flex align-items-center">
                  <TeamOutlined className="me-2" />
                  Bác Sĩ
                </Link>
              </li>
            </ul>
          </Col>
          <Col lg={3} md={6} className="mb-4" style={{ paddingRight: "20px", paddingLeft: "20px" }}>
            <h5 className="text-white mb-4">Dịch Vụ Của Chúng Tôi</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/service" className="text-light">Nha Khoa Tổng Quát</Link>
              </li>
              <li>
                <Link to="/service" className="text-light">Nha Khoa Thẩm Mỹ</Link>
              </li>
              <li>
                <Link to="/service" className="text-light">Chỉnh Nha</Link>
              </li>
              <li>
                <Link to="/service" className="text-light">Cấy Ghép Răng</Link>
              </li>
              <li>
                <Link to="/service" className="text-light">Tẩy Trắng Răng</Link>
              </li>
            </ul>
          </Col>
          <Col lg={3} md={6} className="mb-4" style={{ paddingRight: "20px", paddingLeft: "20px" }}>
            <h5 className="text-white mb-4">Liên Hệ Với Chúng Tôi</h5>
            <p className="text-light">
              <EnvironmentOutlined className="text-primary me-2" />
              Hòa Lạc, Thạch Thất, Hà Nội
            </p>
            <p className="text-light">
              <MailOutlined className="text-primary me-2" />
              info@dentistez.com
            </p>
            <p className="text-light">
              <PhoneOutlined className="text-primary me-2" />
              +012 345 67890
            </p>
            <h6 className="text-white mt-4">Theo Dõi Chúng Tôi</h6>
            <div className="d-flex">
              <a
                className="btn btn-primary btn-lg-square rounded me-2"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TwitterOutlined />
              </a>
              <a
                className="btn btn-primary btn-lg-square rounded me-2"
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FacebookOutlined />
              </a>
              <a
                className="btn btn-primary btn-lg-square rounded me-2"
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedinOutlined />
              </a>
              <a
                className="btn btn-primary btn-lg-square rounded"
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramOutlined />
              </a>
            </div>
          </Col>
        </Row>
        <div className="text-center py-3 border-top border-light mt-4">
          <p className="mb-0">
            © <span className="text-white">DentistEZ</span>. All Rights Reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default FooterComponent;