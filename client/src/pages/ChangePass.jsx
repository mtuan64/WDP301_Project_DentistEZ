import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../assets/css/ChangePassWord.css";
import "../assets/css/AuthPages.css";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validatePassword = (password) => {
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ các trường.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("Mật khẩu mới phải từ 6 ký tự, gồm ít nhất 1 chữ và 1 số.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:9999/api/changepass",
        {
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "SUCCESS") {
        setSuccess("Đổi mật khẩu thành công!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error(response.data.message || "Đổi mật khẩu thất bại.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <h2 className="page-title">Đổi Mật Khẩu</h2>

      {error && <div className="alert error-alert">{error}</div>}
      {success && <div className="alert success-alert">{success}</div>}

      <form onSubmit={handleSubmit} className="change-password-form">
        <div className="form-group">
          <label>Mật khẩu hiện tại</label>
          <div className="password-wrapper">
            <input
              type={showOld ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu hiện tại"
            />
            <span
              className="toggle-icon"
              onClick={() => setShowOld(!showOld)}
            >
              {showOld ? <AiFillEyeInvisible /> : <AiFillEye />}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label>Mật khẩu mới</label>
          <div className="password-wrapper">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu mới"
            />
            <span
              className="toggle-icon"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <AiFillEyeInvisible /> : <AiFillEye />}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label>Xác nhận mật khẩu mới</label>
          <div className="password-wrapper">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Xác nhận lại mật khẩu mới"
            />
            <span
              className="toggle-icon"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <AiFillEyeInvisible /> : <AiFillEye />}
            </span>
          </div>
        </div>

        <div className="button-group">
          <button type="submit" className="btn-success" disabled={loading}>
            {loading ? "Đang xử lý..." : "Đổi Mật Khẩu"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
