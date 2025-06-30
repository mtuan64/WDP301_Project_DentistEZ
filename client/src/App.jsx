import React, { useState } from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DoctorPage from "./pages/DoctorPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPassword";
import VerifyOtpPage from "./pages/VerifyOtp";
import ResetPasswordPage from "./pages/ResetPassword";
import DoctorDetail from "./pages/DoctorDetail";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/Homepage";
import BlogListPage from "./pages/BlogListPage";
import CategoryBlog from "./pages/CategoryBlog"
import BlogPage from "./pages/BlogPage";
import BlogDetail from "./pages/BlogDetail";
import UserListPage from "./pages/UserListManage";
import AppointmentPage from "./pages/AppointmentPage";
import AppointmentManagement from "./pages/AppointmentManagement";
import DoctorAccountManagement from "./pages/DoctorAccountManagement";
import StaticPage from "./pages/StatisticPage";
import Header from "./components/HeaderComponent";
import Topbar from "./components/Topbar";
import MenuComponent from "./components/MenuComponent";

import "antd/dist/reset.css"; 
import AccountManagement from "./pages/AccountManagement";
import ScheduleManagement from "./pages/ScheduleManagement";
import ServiceCard from "./pages/ServiceCard ";
import ServiceDetail from "./pages/ServiceDetail ";
import ServiceManagement from "./pages/ServiceManagement";

import FooterComponent from "./components/FooterComponent";
import Chatbox from "./components/Chatbox";
import "antd/dist/reset.css";


const DRAWER_WIDTH = 240;

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem("user");
  }

  const role = user?.role || "patient";

  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <div>
      <Topbar />
      <Header onMenuClick={toggleMenu} menuOpen={menuOpen} />
      {user && (
        <MenuComponent
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          role={role}
        />
      )}

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
          <Route path="/appointment" element={<AppointmentPage />} />
          <Route path="/userlist" element={<UserListPage />} />
          <Route path="/doctor/:doctorId" element={<DoctorDetail />} />
          <Route path="admin/blogs" element={<BlogListPage />} />
          <Route path="/admin/categories" element={<CategoryBlog />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/doctoraccount" element={<DoctorAccountManagement />} />
          <Route path="/admin/appointments" element={<AppointmentManagement />} />
          <Route path="/accountmanagement"element={<AccountManagement />} />
          <Route path="/doctor/schedule" element={<ScheduleManagement />} />
          <Route path="/services" element={<ServiceCard />} />
          <Route path="/service-detail/:id" element={<ServiceDetail />} />
          <Route path="/servicemanagement" element={<ServiceManagement />}/>

          <Route path="/statistic" element={<StaticPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

        </Routes>
      </div>

      <FooterComponent />
      <Chatbox />
    </div>
  );
};

export default App;