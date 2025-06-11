import React, { useState } from "react";
import { Routes, Route } from "react-router-dom"; // Không cần BrowserRouter ở đây
import ServicePage from "./pages/ServicePage";
import DoctorPage from "./pages/DoctorPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DoctorDetail from "./pages/DoctorDetail";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/Homepage";
import BlogListPage from "./pages/BlogListPage";
import BlogPage from "./pages/BlogPage";
import BlogDetail from "./pages/BlogDetail";
import UserListPage from "./pages/UserListManage";
import AppointmentPage from "./pages/AppointmentPage";
import DoctorAccountManagement from "./pages/DoctorAccountManagement";
import Header from "./components/HeaderComponent";
import MenuComponent from "./components/MenuComponent";
import FooterComponent from "./components/FooterComponent";
import "antd/dist/reset.css";

const DRAWER_WIDTH = 240;

const App = () => {
  // State mở/đóng menu
  const [menuOpen, setMenuOpen] = useState(false);

  // Lấy user và role, xử lý trường hợp null
  let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem("user"); // Xóa dữ liệu không hợp lệ
  }
  const role = user?.role || "patient";

  // Hàm toggle menu
  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <div> {/* Không cần BrowserRouter vì đã có trong main.jsx */}
      {/* Header luôn hiện trên mọi trang */}
      <Header onMenuClick={toggleMenu} menuOpen={menuOpen} />

      {/* Menu Drawer luôn hiện trên mọi trang khi đã đăng nhập */}
      {user && (
        <MenuComponent
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          role={role}
        />
      )}

      {/* Main content, dịch sang phải khi menu mở */}
      <div
        style={{
          marginTop: 84,
          marginLeft: menuOpen ? DRAWER_WIDTH : 0,
          transition: "margin-left 0.3s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicePage />} />
          <Route path="/doctor" element={<DoctorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/myprofile" element={<ProfilePage />} />
          <Route path="/appointment" element={<AppointmentPage />} />
          <Route path="/userlist" element={<UserListPage />} />
          <Route path="/doctor/:doctorId" element={<DoctorDetail />} />
          <Route path="/bloglist" element={<BlogListPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/doctoraccount" element={<DoctorAccountManagement />} />
        </Routes>
      </div>

      {/* Footer luôn hiện trên mọi trang */}
      <FooterComponent />
    </div>
  );
};

export default App;