import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav
      className="navbar navbar-expand-lg bg-white navbar-light shadow-sm px-5 py-3 py-lg-0"
      style={{ position: 'fixed', width: '100%', top: 0, left: 0, zIndex: 3000 }}
      onClick={() => setShowDropdown(false)} // Đóng khi click anywhere
    >
      {/* Nút menu 3 gạch chỉ hiện khi đã đăng nhập */}
      {user && (
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: 24 }} />}
          onClick={onMenuClick}
          style={{
            marginRight: 16,
            border: 'none',
            background: 'none',
            boxShadow: 'none',
            outline: 'none'
          }}
        />
      )}

      <Link to="/" className="navbar-brand p-0 d-flex align-items-center">
        <h1 className="m-0 text-primary" style={{ fontWeight: 700, fontSize: 32 }}>
          <i className="fa fa-tooth me-2"></i>DentistEZ
        </h1>
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarCollapse"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarCollapse">
        <div className="navbar-nav ms-auto py-0 align-items-center d-flex">
          <Link to="/" className="nav-item nav-link">Home</Link>
          <Link to="/about" className="nav-item nav-link">About</Link>
          <Link to="/services" className="nav-item nav-link">Service</Link>
          <Link to="/doctor" className="nav-item nav-link">Doctor</Link>

          {user ? (
            <div 
              className="nav-item" 
              style={{ position: 'relative' }}
              onClick={(e) => e.stopPropagation()} // Ngăn đóng khi click vào dropdown
            >
              <button
                className="nav-link btn btn-link"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ 
                  border: 'none',
                  background: 'none',
                  textDecoration: 'none'
                }}
              >
                Account ▼
              </button>
              
              {showDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    minWidth: '120px',
                    zIndex: 1000
                  }}
                >
                  <Link 
                    to="/myprofile" 
                    style={{
                      display: 'block',
                      padding: '8px 16px',
                      textDecoration: 'none',
                      color: '#333',
                      borderBottom: '1px solid #eee'
                    }}
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      color: '#333',
                      cursor: 'pointer'
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-item nav-link">Login</Link>
              <Link to="/register" className="nav-item nav-link">Register</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn text-dark"
          data-bs-toggle="modal"
          data-bs-target="#searchModal"
        >
          <i className="fa fa-search"></i>
        </button>

        <Link to="/appointment" className="btn btn-primary py-2 px-4 ms-3">
          Appointment
        </Link>
      </div>
    </nav>
  );
};

export default Header;
