import React from 'react';
import { Row, Col } from 'react-bootstrap';

const Topbar = () => {
  return (
    <div className="bg-light py-2 px-5">
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
  );
};

export default Topbar;
