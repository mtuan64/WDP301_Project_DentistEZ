import React, { useState } from "react";
import "../assets/css/Login.css";
import { useLocation, useNavigate } from "react-router-dom";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem("resetToken");
      console.log("Reset token:", token);
      if (!token) {
        alert("No reset token found. Please verify OTP again.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("http://localhost:9999/api/confirm-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();
      console.log("Reset response:", data);

      if (response.ok) {
        alert("Password reset successful!");
        localStorage.removeItem("resetToken");
        navigate("/login");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      alert("An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginWrapper">
        <div className="imageContainer">
          <div className="imagePlaceholder">
            <img
              src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/08763c148032171.62ce0e981e54f.jpg"
              alt="Illustration"
              className="loginImage"
            />
          </div>
        </div>

        <div className="loginFormContainer">
          <h2 className="loginTitle">Đặt Lại Mật Khẩu</h2>
          <form onSubmit={handleResetPassword} className="loginForm">
            <div className="formGroup">
              <label htmlFor="password" className="label">Mật Khẩu Mới</label>
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
            <button type="submit" className="loginButton" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" /> Đang đổi mật khẩu...
                </>
              ) : (
                "Đổi Mật Khẩu"
              )}
            </button>
          </form>
          <div className="signupLink">
            Nhớ mật khẩu? <a href="/login">Đăng nhập</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
