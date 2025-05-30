import React from "react";
import { Container, Row, Col, Button, Form, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";

const FooterComponent = () => {
  return (
    <footer className="bg-dark text-light pt-5">
      <Container>
        <Row className="pt-4">
          <Col lg={3} md={6}>
            <h5 className="text-white mb-4">Quick Links</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-light">Home</Link></li>
              <li><Link to="/about" className="text-light">About Us</Link></li>
              <li><Link to="/services" className="text-light">Our Services</Link></li>
              <li><Link to="/blog" className="text-light">Latest Blog</Link></li>
              <li><Link to="/contact" className="text-light">Contact Us</Link></li>
            </ul>
          </Col>
          <Col lg={3} md={6}>
            <h5 className="text-white mb-4">Popular Links</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-light">Home</Link></li>
              <li><Link to="/about" className="text-light">About Us</Link></li>
              <li><Link to="/services" className="text-light">Our Services</Link></li>
              <li><Link to="/blog" className="text-light">Latest Blog</Link></li>
              <li><Link to="/contact" className="text-light">Contact Us</Link></li>
            </ul>
          </Col>
          <Col lg={3} md={6}>
            <h5 className="text-white mb-4">Get In Touch</h5>
            <p><i className="bi bi-geo-alt text-primary me-2"></i>123 Street, New York, USA</p>
            <p><i className="bi bi-envelope-open text-primary me-2"></i>info@example.com</p>
            <p><i className="bi bi-telephone text-primary me-2"></i>+012 345 67890</p>
          </Col>
          <Col lg={3} md={6}>
            <h5 className="text-white mb-4">Follow Us</h5>
            <div className="d-flex">
              <a className="btn btn-primary btn-lg-square rounded me-2" href="#"><i className="fab fa-twitter"></i></a>
              <a className="btn btn-primary btn-lg-square rounded me-2" href="#"><i className="fab fa-facebook-f"></i></a>
              <a className="btn btn-primary btn-lg-square rounded me-2" href="#"><i className="fab fa-linkedin-in"></i></a>
              <a className="btn btn-primary btn-lg-square rounded" href="#"><i className="fab fa-instagram"></i></a>
            </div>
          </Col>
        </Row>
        <div className="text-center py-3 border-top border-light mt-4">
          <p className="mb-0">&copy; <span className="text-white">DentCare</span>. All Rights Reserved.</p>
        </div>
      </Container>
    </footer>
  );
};


export default FooterComponent;
