import React, { useState } from "react";
import "../css/Login.css";


const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Đăng nhập với:", { username, password });
    // Thêm logic đăng nhập 
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
          {/* )} */}
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
            Bạn Chưa Có Tài Khoản? <a href="#">Đăng Ký</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
