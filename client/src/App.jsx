import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


import DoctorPage from "./pages/DoctorPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DoctorDetail from "./pages/DoctorDetail";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/Homepage";
import BlogListPage from "./pages/BlogListPage";
import DoctorAccountManagement from "./pages/DoctorAccountManagement";
import Header from "./components/HeaderComponent";
import MenuComponent from "./components/MenuComponent";
import "antd/dist/reset.css"; 
import AccountManagement from "./pages/AccountManagement";
import ScheduleManagement from "./pages/ScheduleManagement";
import ServiceCard from "./pages/ServiceCard ";
import ServiceDetail from "./pages/ServiceDetail ";
import ServiceManagement from "./pages/ServiceManagement";

const DRAWER_WIDTH = 240;

const App = () => {
  // State mở/đóng menu
  const [menuOpen, setMenuOpen] = useState(false);

  // Lấy user và role (có thể lấy từ context hoặc localStorage)
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "patient";

  // Hàm toggle menu
  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <Router>
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
          
          <Route path="/doctor" element={<DoctorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/myprofile" element={<ProfilePage />} />
          <Route path="/doctor/:doctorId" element={<DoctorDetail />} />
          <Route path="/bloglist" element={<BlogListPage />} />
          <Route path="/doctoraccount" element={<DoctorAccountManagement />} />
          <Route path="/accountmanagement"element={<AccountManagement />} />
          <Route path="/doctor/schedule" element={<ScheduleManagement />} />
          <Route path="/services" element={<ServiceCard />} />
          <Route path="/service-detail/:id" element={<ServiceDetail />} />
          <Route path="/servicemanagement" element={<ServiceManagement />}/>
        </Routes>
      </div>
    </Router>
  );
};

export default App;
