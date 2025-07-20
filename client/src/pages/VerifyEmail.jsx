import React, { useEffect, useState } from "react";
import "../assets/css/Login.css";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  // const [message, setMessage] = useState("");
  // const [showResend, setShowResend] = useState(false);
  // const [countdown, setCountdown] = useState(60);

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCountdown((prev) => {
  //       if (prev <= 1) {
  //         clearInterval(timer);
  //         setShowResend(true); // Hiện nút sau 60s
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:9999/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      console.log("Verify response:", data);
      if (res.ok) {
        alert(data.message || "Xác thực thành công!");
        navigate("/login");
      } else {
        alert(data.message || "Mã OTP không hợp lệ!");
      }
    } catch (err) {
      alert("Lỗi hệ thống!");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleResendOTP = async () => {
  //   try {
  //     const res = await axios.post("http://localhost:9999/api/send-otp", {
  //       email,
  //     });
  //     setMessage("Đã gửi lại mã OTP, vui lòng kiểm tra email.");
  //     setShowResend(false);
  //     setCountdown(60);

  //     const timer = setInterval(() => {
  //       setCountdown((prev) => {
  //         if (prev <= 1) {
  //           clearInterval(timer);
  //           setShowResend(true);
  //           return 0;
  //         }
  //         return prev - 1;
  //       });
  //     }, 1000);
  //   } catch (error) {
  //     setMessage("Không thể gửi lại OTP. Vui lòng thử lại sau.");
  //   }
  // };

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
          <h2 className="loginTitle">Xác Thực Email</h2>
          <form onSubmit={handleSubmit} className="loginForm">
            <div className="formGroup">
              <label htmlFor="otp" className="label">
                Nhập Mã OTP
              </label>
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

            {/* {showResend ? (
              <button
                type="button"
                onClick={handleResendOTP}
                className="loginButton"
                style={{ marginLeft: "10px", backgroundColor: "#6c757d" }}
              >
                Gửi lại OTP
              </button>
            ) : (
              <span style={{ marginLeft: "10px" }}>
                Gửi lại OTP sau {countdown}s
              </span>
            )} */}
          </form>
          {/* {message && (
            <p style={{ color: "green", marginTop: "10px" }}>{message}</p>
          )} */}
          <div className="signupLink">
            Quay lại <a href="/login">Đăng nhập</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
