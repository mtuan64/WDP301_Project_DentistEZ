import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Drawer } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  LockOutlined,
  CloseOutlined,
  TeamOutlined,
  AppstoreOutlined,
  EditOutlined,
  DollarOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  FileTextOutlined,
  MessageOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

const DRAWER_WIDTH = 240;

// Define menu dynamically based on role and userId
const menuByRole = (role, userId) => {
  const menus = {
    admin: [
      { title: "Home", path: "/", icon: <HomeOutlined /> },
      { title: "Manage Users", path: "/accountmanagement", icon: <TeamOutlined /> },
      { title: "Manage Doctor Account", path: "/doctoraccount", icon: <UserOutlined /> },
      { title: "Manage Service", path: "/servicemanagement", icon: <AppstoreOutlined /> },
      { title: "Manage Blogs", path: "/admin/blogs", icon: <EditOutlined /> },
      { title: "Manage Revenue", path: "/admin/payments", icon: <DollarOutlined /> },
      { title: "Statistic Dashboard", path: "/statistic", icon: <BarChartOutlined /> },
      { title: "Manage Appointments", path: "/admin/appointments", icon: <CalendarOutlined /> },
    ],
    doctor: [
      { title: "Home", path: "/", icon: <HomeOutlined /> },
      { title: "Schedule Management", path: "/doctor/schedule", icon: <CalendarOutlined /> },
      { title: "Report Management", path: "/report", icon: <FileTextOutlined /> },
      { title: "Message Management", path: "/message-management", icon: <MessageOutlined /> },
      { title: "Attendance Management", path: "/attendance-management", icon: <ScheduleOutlined /> },
      { title: "Recruitment Management", path: "/recruitment-management-mentor", icon: <UsergroupAddOutlined /> },
    ],
    staff: [
      { title: "Home", path: "/", icon: <HomeOutlined /> },
      { title: "Patient Appointment Management ", path: "/staffmanager/patientapp", icon: <UserOutlined /> },
      { title: "Payment transaction history", path: "staffmanager/paymenthistory", icon: <FileTextOutlined /> },
    ],
    patient: [
      { title: "Trang chủ", path: "/", icon: <HomeOutlined /> },
      { title: "Lịch hẹn của tôi", path: `/myappointment`, icon: <CalendarOutlined /> },
      { title: "Lịch sử giao dịch", path: "/paymenthistory", icon: <FileTextOutlined /> },
      { title: "Schedule", path: "/schedule", icon: <ScheduleOutlined /> },
      { title: "Attendance", path: "/attendance", icon: <UsergroupAddOutlined /> },
      { title: "Mark Report", path: "/mark-report", icon: <EditOutlined /> },
    ],
  };

  return menus[role] || [];
};

const MenuComponent = ({ isOpen, onClose, role, userId }) => {
  const location = useLocation();
  const navigations = menuByRole(role, userId);

  return (
    <Drawer
      title={null}
      placement="left"
      onClose={onClose}
      open={isOpen}
      closeIcon={<CloseOutlined style={{ fontSize: 20 }} />}
      width={DRAWER_WIDTH}
      style={{ top: 70 }}
      mask={false}
      styles={{
        body: {
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        },
      }}
      className="custom-drawer"
    >
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "100%",
          height: "calc(100vh - 64px)",
          overflowY: "auto",
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        {navigations.map(({ title, path, icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={title}
              to={path}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 28px",
                fontSize: "16px",
                color: isActive ? "#1890ff" : "#333",
                textDecoration: "none",
                borderRadius: "0 24px 24px 0",
                background: isActive ? "#e6f7ff" : "transparent",
                fontWeight: isActive ? 600 : 400,
                margin: "2px 0",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {React.cloneElement(icon, { style: { fontSize: 20 } })}
              <span>{title}</span>
            </Link>
          );
        })}
      </nav>
    </Drawer>
  );
};

export default MenuComponent;
