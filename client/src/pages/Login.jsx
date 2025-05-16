import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/Login.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:9999/api/client/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        alert(data.msg);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginWrapper">
        {/* Phần bên trái - Hình ảnh mô tả */}
        <div className="imageContainer">
          <div className="imagePlaceholder">
            <h3>Hình Ảnh Minh Họa</h3>
            <p>Đây là nơi bạn sẽ đặt hình ảnh mô tả.</p>
          </div>
        </div>

        {/* Phần bên phải - Form đăng nhập */}
        <div className="loginFormContainer">
          <h2 className="loginTitle">ĐĂNG NHẬP</h2>
          <form onSubmit={handleSubmit} className="loginForm">
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
            <div className="forgotPasswordLink">
              <a href="/forgot-password">Bạn quên mật khẩu ?</a>
            </div>
            <button type="submit" className="loginButton">
              Đăng Nhập
            </button>
          </form>
          <div className="signupLink">
            Bạn Chưa Có Tài Khoản? <a href="/register">Đăng Ký</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
