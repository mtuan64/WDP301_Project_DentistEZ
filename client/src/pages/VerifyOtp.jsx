import React, { useState } from "react";
import "../assets/css/Login.css";
import { useLocation, useNavigate } from "react-router-dom";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:9999/api/verify-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      console.log("Verify response:", data);

      if (response.ok) {
        localStorage.setItem("resetToken", data.token);
        alert("OTP verified successfully!");
        navigate("/reset-password", { state: { email } });
      } else {
        alert(data.message);
      }
    } catch (error) {
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
          <h2 className="loginTitle">Xác Thực OTP</h2>
          <form onSubmit={handleVerifyOtp} className="loginForm">
            <div className="formGroup">
              <label htmlFor="otp" className="label">Nhập Mã OTP</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input"
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="loginButton" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" /> Đang xác nhận...
                </>
              ) : (
                "Xác Nhận"
              )}
            </button>
          </form>
          <div className="signupLink">
            Quay lại <a href="/login">Đăng nhập</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
