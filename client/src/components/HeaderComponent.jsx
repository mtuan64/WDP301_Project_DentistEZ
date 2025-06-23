import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { Button, Avatar, Dropdown } from "antd";
import {
  MenuOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  BookOutlined,
  ToolOutlined,
  TeamOutlined,
  UserOutlined,
  LoginOutlined,
  UserAddOutlined,
  SearchOutlined,
  CalendarOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const accountMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link to="/myprofile">Profile</Link>,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Log out",
      onClick: handleLogout,
    },
  ];

  const guestMenuItems = [
    {
      key: "login",
      icon: <LoginOutlined />,
      label: <Link to="/login">Login</Link>,
    },
    {
      key: "register",
      icon: <UserAddOutlined />,
      label: <Link to="/register">Register</Link>,
    },
  ];

  return (
    <nav
      className="navbar navbar-expand-lg bg-white navbar-light shadow-sm px-5 py-3 py-lg-0"
      style={{ position: "fixed", width: "100%", top: 0, left: 0, zIndex: 3000 }}
    >
      {user && (
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: 24 }} />}
          onClick={onMenuClick}
          style={{
            marginRight: 16,
            border: "none",
            background: "none",
            boxShadow: "none",
            outline: "none",
          }}
        />
      )}

      <Link to="/" className="navbar-brand p-0 d-flex align-items-center">
        <h1 className="m-0 text-primary" style={{ fontWeight: 700, fontSize: 32 }}>
          <i className="fa fa-tooth me-2"></i>DentistEZ
        </h1>
      </Link>

      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarCollapse">
        <div className="navbar-nav ms-auto py-0 align-items-center d-flex">
          <Link to="/" className="nav-item nav-link">
            <HomeOutlined style={{ marginRight: 8 }} />
            Home
          </Link>
          <Link to="/about" className="nav-item nav-link">
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            About
          </Link>
          <Link to="/blog" className="nav-item nav-link">
            <BookOutlined style={{ marginRight: 8 }} />
            Blog
          </Link>
          <Link to="/service" className="nav-item nav-link">
            <ToolOutlined style={{ marginRight: 8 }} />
            Service
          </Link>
          <Link to="/doctor" className="nav-item nav-link">
            <TeamOutlined style={{ marginRight: 8 }} />
            Doctor
          </Link>

          {/* ✅ Account Dropdown */}
          {user ? (
            <Dropdown menu={{ items: accountMenuItems }} trigger={["click"]}>
              <div className="nav-item nav-link d-flex align-items-center" style={{ cursor: "pointer" }}>
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  src={user.avatar || undefined}
                  style={{ marginRight: 8 }}
                />
                {user.username}
              </div>
            </Dropdown>
          ) : (
            <Dropdown menu={{ items: guestMenuItems }} trigger={["click"]}>
              <div className="nav-item nav-link d-flex align-items-center" style={{ cursor: "pointer" }}>
                <UserOutlined style={{ marginRight: 8 }} />
                Account
              </div>
            </Dropdown>
          )}
        </div>
{/* 
        <button type="button" className="btn text-dark" data-bs-toggle="modal" data-bs-target="#searchModal">
          <SearchOutlined />
        </button> */}

        <Link to="/appointment" className="btn btn-primary py-2 px-4 ms-3">
          <CalendarOutlined style={{ marginRight: 8 }} />
          Appointment
        </Link>
      </div>
    </nav>
  );
};

export default Header;