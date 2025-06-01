import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import "../assets/css/ProfilePage.css";

const ProfilePage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Initialize form data with all editable fields
  const [formData, setFormData] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
    gender: user?.gender || "",
  });
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Sync form data with user changes
  useEffect(() => {
    setFormData({
      fullname: user?.fullname || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
      gender: user?.gender || "",
    });
    setProfilePicture(user?.profilePicture || null);
  }, [user]);

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file selection for profile picture
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProfilePicture(URL.createObjectURL(selectedFile)); // Local preview
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Log the token to debug
      console.log("Token being sent:", user?.token);
      if (!user?.token) {
        throw new Error("No token found. Please log in again.");
      }

      // Update profile picture if a file is selected
      let updatedProfilePicture = profilePicture;
      if (file) {
        const formData = new FormData();
        formData.append("profilePicture", file);

        const response = await fetch("http://localhost:9999/api/user/upload-profile-picture", {
          method: "POST", // Reverted to POST
          headers: {
            "Authorization": `Bearer ${user.token}`,
          },
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          console.log("Profile picture upload error:", data); // Debug log
          throw new Error(data.msg || "Failed to upload profile picture");
        }
        updatedProfilePicture = data.profilePictureUrl; // Backend returns URL
      }

      // Update user details
      const response = await fetch("http://localhost:9999/api/user/update", {
        method: "POST", // Reverted to POST
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          fullname: formData.fullname,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          profilePicture: updatedProfilePicture,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Update localStorage and auth context
        const updatedUser = {
          ...user,
          ...formData,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
          profilePicture: updatedProfilePicture,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        login(updatedUser);
        setSuccess("Hồ sơ đã được cập nhật thành công!");
        setFile(null); // Clear file input
      } else {
        console.log("User update error:", data); // Debug log
        throw new Error(data.msg || "Không thể cập nhật hồ sơ");
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
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
                  value={user?.username || ""}
                  className="form-control"
                  disabled
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="role" className="form-label">
                  Vai Trò
                </label>
                <input
                  type="text"
                  id="role"
                  value={user?.role || ""}
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
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-control"
                  required
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
            <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
              {loading ? "Đang Lưu..." : "Lưu Thay Đổi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;