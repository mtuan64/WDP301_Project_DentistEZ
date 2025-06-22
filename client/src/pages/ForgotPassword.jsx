import React, { useState } from "react";
import "../assets/css/Login.css"; // reuse the login styling
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:9999/api/reset-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("OTP sent to your email.");
        navigate("/verify-otp", { state: { email } });
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
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
          <h2 className="loginTitle">Quên Mật Khẩu</h2>
          <form onSubmit={handleRequestOTP} className="loginForm">
            <div className="formGroup">
              <label htmlFor="email" className="label">Nhập Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="loginButton" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" /> Đang gửi OTP...
                </>
              ) : (
                "Gửi OTP"
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

export default ForgotPasswordPage;
