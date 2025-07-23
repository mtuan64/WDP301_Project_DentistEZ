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
      { title: "Trang chủ", path: "/", icon: <HomeOutlined /> },
      { title: "Quản lý người dùng", path: "/accountmanagement", icon: <TeamOutlined /> },
      { title: "Thông tin bác sĩ", path: "/doctoraccount", icon: <UserOutlined /> },
      { title: "Quản lý dịch vụ", path: "/servicemanagement", icon: <AppstoreOutlined /> },
      { title: "Quản lý bài viết", path: "/admin/blogs", icon: <EditOutlined /> },
      { title: "Quản lý hóa đơn", path: "/admin/payments", icon: <DollarOutlined /> },
      { title: "Thống kê", path: "/statistic", icon: <BarChartOutlined /> },
      { title: "Quản lý lịch đặt", path: "/admin/appointments", icon: <CalendarOutlined /> },
      { title: "Lịch trình bác sĩ", path: "/schedule", icon: <CalendarOutlined /> },
    ],
    doctor: [
      { title: "Trang chủ", path: "/", icon: <HomeOutlined /> },
      { title: "Quản lý lịch trình", path: "/doctor/schedule", icon: <CalendarOutlined /> },
      
    ],
    staff: [
      { title: "Trang chủ", path: "/", icon: <HomeOutlined /> },
      { title: "Quản lý lịch khám bệnh nhân ", path: "/staffmanager/patientapp", icon: <UserOutlined /> },
      { title: "Lịch sử giao dịch", path: "staffmanager/paymenthistory", icon: <FileTextOutlined /> },
      { title: "Quản lý hoàn tiền lịch hủy", path: "/staffmanager/refunds", icon: <DollarOutlined /> },
    ],
    patient: [
      { title: "Trang chủ", path: "/", icon: <HomeOutlined /> },
      { title: "Lịch hẹn của tôi", path: `/myappointment`, icon: <CalendarOutlined /> },
      { title: "Lịch sử giao dịch", path: "/paymenthistory", icon: <FileTextOutlined /> },
      
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