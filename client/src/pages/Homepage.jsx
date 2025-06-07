import React from "react";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import FooterComponent from "../components/FooterComponent";

import '../assets/css/HomePage.css'

const HomePage = () => {
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
              src="https://alonadecor.com/wp-content/uploads/2017/09/alona41.jpg"
              className="d-block w-100"
              alt="Dental Banner"
              style={{ objectFit: 'cover', height: '90vh' }}
            />
            {/* Overlay + Caption */}
            <div
              className="carousel-caption d-flex flex-column justify-content-center align-items-center text-center"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: '0 15px'
              }}
            >
              <div className="text-white">
                <h5 className="text-uppercase fw-semibold mb-3" style={{ letterSpacing: '2px' }}>
                  Keep Your Teeth Healthy
                </h5>
                <h1 className="display-3 fw-bold mb-4">
                  Take The Best Quality Dental Treatment
                </h1>
                <div>
                  <Link to="/appointment" className="btn btn-primary btn-lg px-4 me-3 shadow">
                    Appointment
                  </Link>
                  <Link to="/contact" className="btn btn-outline-light btn-lg px-4 shadow">
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Banner Section */}
      <Container fluid className="my-5">
        <Row>
          <Col lg={4} className="bg-primary text-white p-5">
            <h3>Opening Hours</h3>
            <p>Mon - Fri: 8:00am - 9:00pm</p>
            <p>Saturday: 8:00am - 7:00pm</p>
            <p>Sunday: 8:00am - 5:00pm</p>
            <Link to="/appointment" className="btn btn-light">Appointment</Link>
          </Col>
          <Col lg={4} className="bg-dark text-white p-5">
            <h3>Search A Doctor</h3>
            <Form>
              <Form.Control className="mb-3" placeholder="Appointment Date" />
              <Form.Select className="mb-3">
                <option>Select A Service</option>
                <option>Service 1</option>
                <option>Service 2</option>
              </Form.Select>
              <Button variant="light">Search Doctor</Button>
            </Form>
          </Col>
          <Col lg={4} className="bg-secondary text-white p-5">
            <h3>Make Appointment</h3>
            <p>Quick appointment via phone.</p>
            <h2>+012 345 6789</h2>
          </Col>
        </Row>
      </Container>

      {/* About Us */}
      <Container className="py-5">
        <Row className="align-items-center">
          <Col lg={7}>
            <h5 className="text-primary text-uppercase">About Us</h5>
            <h1 className="mb-4">The World's Best Dental Clinic That You Can Trust</h1>
            <h4 className="text-muted fst-italic">
              Diam dolor diam ipsum sit. Clita erat ipsum et lorem stet no lorem sit clita duo justo magna dolore
            </h4>
            <p>
              Tempor erat elitr rebum at clita. Diam dolor diam ipsum et tempor sit. Aliqu diam amet diam et eos labore.
            </p>
            <Row>
              <Col sm={6}>
                <p><i className="fa fa-check-circle text-primary me-2"></i>Award Winning</p>
                <p><i className="fa fa-check-circle text-primary me-2"></i>Professional Staff</p>
              </Col>
              <Col sm={6}>
                <p><i className="fa fa-check-circle text-primary me-2"></i>24/7 Opened</p>
                <p><i className="fa fa-check-circle text-primary me-2"></i>Fair Prices</p>
              </Col>
            </Row>
            <Link to="/appointment" className="btn btn-primary mt-4">Make Appointment</Link>
          </Col>
          <Col lg={5}>
            <img src="/img/about.jpg" className="img-fluid rounded" alt="About DentCare" />
          </Col>
        </Row>
      </Container>

      {/* APPOINTMENT SECTION */}
      <div className="container-fluid bg-primary bg-appointment my-5">
        <div className="container">
          <div className="row gx-5">
            <div className="col-lg-6 py-5">
              <div className="py-5">
                <h1 className="display-5 text-white mb-4">
                  We Are A Certified and Award Winning Dental Clinic You Can
                  Trust
                </h1>
                <p className="text-white mb-0">Eirmod sed tempor lorem ut dolores...</p>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="appointment-form h-100 d-flex flex-column justify-content-center text-center p-5">
                <h1 className="text-white mb-4">Make Appointment</h1>
                <form>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <select
                        className="form-select bg-light border-0"
                        style={{ height: "55px" }}
                      >
                        <option>Select A Service</option>
                        <option value="1">Service 1</option>
                        <option value="2">Service 2</option>
                        <option value="3">Service 3</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className="form-control bg-light border-0"
                        placeholder="Your Name"
                        style={{ height: "55px" }}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="email"
                        className="form-control bg-light border-0"
                        placeholder="Your Email"
                        style={{ height: "55px" }}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className="form-control bg-light border-0"
                        placeholder="Your Mobile"
                        style={{ height: "55px" }}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="date"
                        className="form-control bg-light border-0"
                        style={{ height: "55px" }}
                      />
                    </div>
                    <div className="col-12">
                      <button
                        className="btn btn-dark w-100 py-3"
                        type="submit"
                      >
                        Make Appointment
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* SERVICES SECTION */}
      <div className="container-fluid py-5">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: "500px" }}>
            <h5 className="text-primary text-uppercase">Our Services</h5>
            <h1 className="display-5">Exceptional Dental Care For You</h1>
          </div>
          <div className="row g-4">
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
              <div className="service-item bg-light rounded text-center p-4">
                <div className="service-icon bg-white shadow rounded-circle mb-4 mx-auto">
                  <i className="fa fa-tooth fa-2x text-primary"></i>
                </div>
                <h4 className="mb-3">Teeth Whitening</h4>
                <p>
                  Amet justo dolor lorem kasd amet magna sea stet eos sit sed
                  lorem.
                </p>
                <a href="/" className="btn btn-primary rounded-pill px-3">
                  Read More
                </a>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
              <div className="service-item bg-light rounded text-center p-4">
                <div className="service-icon bg-white shadow rounded-circle mb-4 mx-auto">
                  <i className="fa fa-user-md fa-2x text-primary"></i>
                </div>
                <h4 className="mb-3">Dental Implants</h4>
                <p>
                  Amet justo dolor lorem kasd amet magna sea stet eos sit sed
                  lorem.
                </p>
                <a href="/" className="btn btn-primary rounded-pill px-3">
                  Read More
                </a>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.5s">
              <div className="service-item bg-light rounded text-center p-4">
                <div className="service-icon bg-white shadow rounded-circle mb-4 mx-auto">
                  <i className="fa fa-brush fa-2x text-primary"></i>
                </div>
                <h4 className="mb-3">Cosmetic Dentistry</h4>
                <p>
                  Amet justo dolor lorem kasd amet magna sea stet eos sit sed
                  lorem.
                </p>
                <a href="/" className="btn btn-primary rounded-pill px-3">
                  Read More
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* OFFER SECTION */}
      <div className="container-fluid bg-offer my-5 py-5" style={{ backgroundImage: 'url("https://alonadecor.com/wp-content/uploads/2017/09/alona41.jpg")', backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="container py-5">
          <div className="row gx-5 justify-content-center">
            <div className="col-lg-6">
              <div className="bg-white p-5 rounded">
                <h1 className="mb-4">We Are Offering 20% Discount For New Patients</h1>
                <p>
                  Tempor erat elitr rebum at clita. Diam dolor diam ipsum et
                  tempor sit. Aliqu diam amet diam et eos labore.
                </p>
                <Link to="/appointment" className="btn btn-primary py-3 px-5 mt-4">
                  Make Appointment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* PRICING SECTION */}
      <div className="container-fluid py-5">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: "500px" }}>
            <h5 className="text-primary text-uppercase">Our Pricing</h5>
            <h1 className="display-5">Choose Your Plan</h1>
          </div>
          <div className="row g-4">
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
              <div className="pricing-item rounded text-center p-4">
                <div className="bg-light rounded-pill d-inline-block mb-4 py-1 px-5">
                  Basic
                </div>
                <h2 className="mb-4">$49.00</h2>
                <p>Amet justo dolor lorem kasd amet magna sea stet eos sit sed lorem</p>
                <ul className="list-unstyled mb-4">
                  <li className="mb-2">24/7 Support</li>
                  <li className="mb-2">Dental Consultation</li>
                  <li className="mb-2">Routine Checkup</li>
                </ul>
                <Link to="/appointment" className="btn btn-primary py-2 px-4">
                  Make Appointment
                </Link>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
              <div className="pricing-item rounded text-center p-4">
                <div className="bg-primary rounded-pill d-inline-block mb-4 py-1 px-5 text-white">
                  Standard
                </div>
                <h2 className="mb-4">$99.00</h2>
                <p>Amet justo dolor lorem kasd amet magna sea stet eos sit sed lorem</p>
                <ul className="list-unstyled mb-4">
                  <li className="mb-2">24/7 Support</li>
                  <li className="mb-2">Dental Consultation</li>
                  <li className="mb-2">Routine Checkup</li>
                  <li className="mb-2">Emergency Treatment</li>
                </ul>
                <Link to="/appointment" className="btn btn-primary py-2 px-4">
                  Make Appointment
                </Link>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.5s">
              <div className="pricing-item rounded text-center p-4">
                <div className="bg-light rounded-pill d-inline-block mb-4 py-1 px-5">
                  Premium
                </div>
                <h2 className="mb-4">$149.00</h2>
                <p>Amet justo dolor lorem kasd amet magna sea stet eos sit sed lorem</p>
                <ul className="list-unstyled mb-4">
                  <li className="mb-2">24/7 Support</li>
                  <li className="mb-2">Dental Consultation</li>
                  <li className="mb-2">Routine Checkup</li>
                  <li className="mb-2">Emergency Treatment</li>
                  <li className="mb-2">Cosmetic Dentistry</li>
                </ul>
                <Link to="/appointment" className="btn btn-primary py-2 px-4">
                  Make Appointment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default HomePage;