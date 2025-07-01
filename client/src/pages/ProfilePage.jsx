import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/css/ProfilePage.css";

const ProfilePage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // State để quản lý dữ liệu form
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Khởi tạo dữ liệu form từ user khi component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!user || !token) {
      setError("Vui lòng đăng nhập để tiếp tục.");
      navigate("/login");
      return;
    }

    setFormData({
      username: user.username || "",
      fullname: user.fullname || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      gender: user.gender || "",
    });
    setProfilePicture(user.profilePicture || null);
  }, [user, navigate]);

  // Hàm validate
  const validatePhone = (phone) => {
    if (!phone) return true; // Trường không bắt buộc
    const phoneRegex = /^0[35789][0-9]{8}$/; // Bắt đầu bằng 0, theo sau là 3,5,7,8,9 và 8 số nữa
    return phoneRegex.test(phone);
  };

  const validateDateOfBirth = (date) => {
    if (!date) return true; // Trường không bắt buộc
    const inputDate = new Date(date);
    const today = new Date();
    const minDate = new Date("1900-01-01");
    return (
      !isNaN(inputDate.getTime()) && inputDate <= today && inputDate >= minDate
    );
  };

  const validateFullname = (name) => {
    return (
      name.length >= 2 && name.length <= 50 && /^[a-zA-Z\sÀ-ỹ]+$/.test(name)
    );
  };

  const validateAddress = (address) => {
    if (!address) return true; // Trường không bắt buộc
    return address.length <= 200;
  };

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý upload file ảnh
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Kích thước ảnh không được vượt quá 5MB.");
        return;
      }
      if (!selectedFile.type.startsWith("image/")) {
        setError("Vui lòng chọn file ảnh (jpg, png, ...).");
        return;
      }
      setFile(selectedFile);
      setProfilePicture(URL.createObjectURL(selectedFile));
    }
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = user?.token || localStorage.getItem("token");
      if (!token) {
        throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      }

      const userId = user?.id || JSON.parse(localStorage.getItem("user"))?.id;
      if (!userId) {
        throw new Error(
          "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại."
        );
      }

      // Validate các trường
      if (!validateFullname(formData.fullname)) {
        throw new Error("Họ tên phải từ 2-50 ký tự và chỉ chứa chữ cái.");
      }

      if (formData.phone && !validatePhone(formData.phone)) {
        throw new Error(
          "Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09."
        );
      }

      if (formData.dateOfBirth && !validateDateOfBirth(formData.dateOfBirth)) {
        throw new Error("Ngày sinh phải từ năm 1900 đến hiện tại.");
      }

      if (formData.address && !validateAddress(formData.address)) {
        throw new Error("Địa chỉ không được vượt quá 200 ký tự.");
      }

      const validGenders = ["male", "female", "other", ""];
      if (formData.gender && !validGenders.includes(formData.gender)) {
        throw new Error("Giới tính không hợp lệ.");
      }

      // Chuẩn bị dữ liệu gửi API (không bao gồm email)
      const updateData = {
        fullname: formData.fullname,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth).toISOString()
          : undefined,
        gender: formData.gender || undefined,
      };

      // Xóa các trường undefined
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      let updatedProfilePicture = profilePicture;
      if (file) {
        const uploadData = new FormData();
        uploadData.append("profilePicture", file);

        const uploadResponse = await axios.post(
          "http://localhost:9999/api/user/upload-picture-profile",
          uploadData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (uploadResponse.data.status !== "SUCCESS") {
          throw new Error(
            uploadResponse.data.message || "Lỗi khi upload ảnh đại diện."
          );
        }
        updatedProfilePicture = uploadResponse.data.data.profilePicture;
      }

      const profileResponse = await axios.put(
        "http://localhost:9999/api/user/profile",
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (profileResponse.data.status !== "SUCCESS") {
        throw new Error(
          profileResponse.data.message || "Lỗi khi cập nhật hồ sơ."
        );
      }

      // Cập nhật thông tin user
      const updatedUser = {
        ...user,
        ...profileResponse.data.data,
        profilePicture:
          updatedProfilePicture || profileResponse.data.data.profilePicture,
        token,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      login(updatedUser);
      setSuccess("Hồ sơ đã được cập nhật thành công!");
      setFile(null);
    } catch (err) {
      console.error("Lỗi khi cập nhật hồ sơ:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data || "No response data",
      });
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Đã xảy ra lỗi. Vui lòng thử lại.";
      setError(errorMessage);
      if (
        err.response?.status === 401 ||
        errorMessage.includes("Phiên đăng nhập hết hạn")
      ) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h2 className="text-primary mb-4">Hồ Sơ Cá Nhân</h2>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="text-center mb-4">
            <img
              src={profilePicture || "https://via.placeholder.com/150"}
              alt="Profile"
              className="rounded-circle mb-3"
              style={{ width: "150px", height: "150px", objectFit: "cover" }}
            />
            <div>
              <label htmlFor="profilePicture" className="btn btn-primary">
                Tải Lên Ảnh Đại Diện
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleFileChange}
                  hidden
                />
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="username" className="form-label">
                  Tên Người Dùng
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  className="form-control"
                  disabled
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="fullname" className="form-label">
                  Họ và Tên
                </label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                  pattern="^[a-zA-Z\sÀ-ỹ]{2,50}$"
                  title="Họ tên phải từ 2-50 ký tự và chỉ chứa chữ cái."
                />
              </div>

              <div className="col-md-6 mb UX-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  className="form-control"
                  disabled
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="phone" className="form-label">
                  Số Điện Thoại
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-control"
                  pattern="^0[35789][0-9]{8}$"
                  placeholder="VD: 0912345678"
                  title="Số điện thoại phải có 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09."
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="address" className="form-label">
                  Địa Chỉ
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="form-control"
                  maxLength="200"
                  title="Địa chỉ không được vượt quá 200 ký tự."
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="dateOfBirth" className="form-label">
                  Ngày Sinh
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="form-control"
                  max={new Date().toISOString().split("T")[0]}
                  min="1900-01-01"
                  title="Ngày sinh phải từ năm 1900 đến hiện tại."
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="gender" className="form-label">
                  Giới Tính
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary mt-3"
              disabled={loading}
            >
              {loading ? "Đang Lưu..." : "Lưu Thay Đổi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
