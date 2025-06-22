import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "../assets/css/Login.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);  // Loading state here
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);  // start loading
    try {
      const response = await fetch("http://localhost:9999/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful, user data:", data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        login(data.user);

        if (data.requireProfileCompletion) {
          alert(data.msg);
          setTimeout(() => navigate("/myprofile"), 0);
        } else {
          alert(data.msg);
          setTimeout(() => navigate("/"), 0);
        }
      } else {
        console.error("Login failed:", data.msg);
        alert(data.msg);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);  // stop loading regardless of outcome
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginWrapper">
        <div className="imageContainer">
          <div className="imagePlaceholder">
            <img
              src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/08763c148032171.62ce0e981e54f.jpg"
              alt="Hình ảnh minh họa"
              className="loginImage"
            />
          </div>
        </div>

        <div className="loginFormContainer">
          <h2 className="loginTitle">ĐĂNG NHẬP</h2>
          <form onSubmit={handleSubmit} className="loginForm">
            <div className="formGroup">
              <label htmlFor="email" className="label">Tên Người Dùng</label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                disabled={isLoading}
              />
            </div>
            <div className="formGroup">
              <label htmlFor="password" className="label">Mật Khẩu</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                disabled={isLoading}
              />
            </div>
            <div className="forgotPasswordLink">
              <a href="/forgot-password">Bạn quên mật khẩu ?</a>
            </div>
            <button
              type="submit"
              className="loginButton"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" /> Đang đăng nhập...
                </>
              ) : (
                "Đăng Nhập"
              )}
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
