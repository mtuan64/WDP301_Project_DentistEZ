import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/Register.css"; 

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const roleid = 1; 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:9999/api/client/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
            fullname,
            email,
            phone,
            address,
            dob,
            gender,
            roleid,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        alert("Registration successful!");
        navigate("/login");
      } else {
        alert(data.msg);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="registerContainer">
      <div className="registerWrapper">
        {/* Phần bên trái - Hình ảnh mô tả */}
        <div className="imageContainer">
          <div className="imagePlaceholder">
            <h3>Hình Ảnh Minh Họa</h3>
            <p>Đây là nơi bạn sẽ đặt hình ảnh mô tả.</p>
          </div>
        </div>
        {/* Phần bên phải - Form đăng ký */}
        <div className="registerFormContainer">
          <h2 className="registerTitle">ĐĂNG KÝ</h2>
          <form onSubmit={handleSubmit} className="registerForm">
            <div className="formGroup">
              <label htmlFor="username" className="label">
                Tên Người Dùng
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="password" className="label">
                Mật Khẩu
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="fullname" className="label">
                Họ và Tên
              </label>
              <input
                type="text"
                id="fullname"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="phone" className="label">
                Số Điện Thoại
              </label>
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="address" className="label">
                Địa Chỉ
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="dob" className="label">
                Ngày Sinh
              </label>
              <input
                type="date"
                id="dob"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="gender" className="label">
                Giới Tính
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input"
                required
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <button type="submit" className="registerButton">
              Đăng Ký
            </button>
          </form>
          <div className="loginLink">
            Bạn Đã Có Tài Khoản? <a href="/login">Đăng Nhập</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
