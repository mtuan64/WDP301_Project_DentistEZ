import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/authContext";
import "../assets/css/Login.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Google Login
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
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        login(data.user);
        alert(data.msg);
        navigate("/");
      } else {
        alert(data.msg);
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Có lỗi khi đăng nhập bằng Google.");
    }
  };

  // Normal login
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

        if (data.requireProfileCompletion) {
          alert(data.msg);
          navigate("/myprofile");
        } else {
          alert(data.msg);
          navigate("/");
        }
      } else {
        alert(data.msg);
      }
    } catch (error) {
      console.error("Login error:", error);
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
                disabled={isLoading}
              />
            </div>

            <div className="forgotPasswordLink">
              <a href="/forgot-password">Bạn quên mật khẩu?</a>
            </div>

            <button type="submit" className="loginButton" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" /> Đang đăng nhập...
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
    </div>
  );
};

export default LoginPage;
