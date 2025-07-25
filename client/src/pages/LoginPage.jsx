import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/authContext";
import "../assets/css/Login.css";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import "../assets/css/AuthPages.css";
import { Modal } from "antd";
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    title: "",
    content: "",
    onOk: null,
  });

  const showNotification = (title, content, onOk = null) => {
    setNotification({ visible: true, title, content, onOk });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, visible: false }));
    if (notification.onOk) {
      notification.onOk();
    }
  };

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id:
          "1003280842-hd4tp4najthm4sqal9akmqah10nrevfa.apps.googleusercontent.com",
        callback: handleGoogleResponse,
        ux_mode: "popup",
        auto_select: false,
        context: "signin",
        cancel_on_tap_outside: false,
        hl: "vi",
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleButton"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    const decoded = jwtDecode(response.credential);
    console.log("Google user:", decoded);

    try {
      const res = await fetch("http://localhost:9999/api/gg-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        const user = {
          ...data.user,
          id: data.user._id || data.user.id,
        };

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", data.token);
        login(user);
        showNotification("Thành công", data.msg, () => navigate("/"));
      } else {
        showNotification("Lỗi", data.msg);
      }
    } catch (err) {
      console.error("Google login error:", err);
      showNotification("Lỗi", "Có lỗi khi đăng nhập bằng Google.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:9999/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        login(data.user);
        showNotification("Thành công", data.msg, () => {
          if (data.requireProfileCompletion) {
            navigate("/myprofile");
          } else {
            navigate("/");
          }
        });
      } else {
        showNotification("Lỗi", data.msg);
      }
    } catch (error) {
      console.error("Login error:", error);
      showNotification("Lỗi", "An error occurred. Please try again.");
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
              alt="Hình ảnh minh họa"
              className="loginImage"
            />
          </div>
        </div>

        <div className="loginFormContainer">
          <h2 className="loginTitle">ĐĂNG NHẬP</h2>

          <form onSubmit={handleSubmit} className="loginForm">
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
                disabled={isLoading}
              />
            </div>
            <div className="formGroup">
              <div className="formGroup">
                <label htmlFor="password" className="label">
                  Mật Khẩu
                </label>
                <div className="passwordWrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    required
                    disabled={isLoading}
                  />
                  <span
                    className="passwordToggleIcon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                  </span>
                </div>
              </div>
            </div>

            <div className="forgotPasswordLink">
              <a href="/forgot-password">Bạn quên mật khẩu?</a>
            </div>

            <button type="submit" className="loginButton" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" /> Đang xử lý...
                </>
              ) : (
                "Đăng Nhập"
              )}
            </button>
          </form>

          <div style={{ margin: "16px 0" }}>
            <div id="googleButton"></div>
          </div>

          <div className="signupLink">
            Bạn chưa có tài khoản? <a href="/register">Đăng Ký</a>
          </div>
        </div>
      </div>
      <Modal
        title={notification.title}
        open={notification.visible}
        onOk={handleCloseNotification}
        onCancel={handleCloseNotification}
        okText="Đóng"
        centered
      >
        <p>{notification.content}</p>
      </Modal>
    </div>
  );
};

export default LoginPage;
