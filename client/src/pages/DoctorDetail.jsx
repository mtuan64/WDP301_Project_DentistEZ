import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import PersonIcon from "@mui/icons-material/Person";
import "../assets/css/DoctorDetail.css";

const DoctorDetail = () => {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hàm trích xuất và giới hạn nội dung
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength - 3) + "...";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch doctor by ID
        const doctorResponse = await axios.get(`http://localhost:9999/api/doctor/${doctorId}`);
        console.log("Doctor API Response:", doctorResponse.data);
        if (doctorResponse.data.data) {
          setDoctor(doctorResponse.data.data);
        } else if (doctorResponse.data) {
          setDoctor(doctorResponse.data);
        } else {
          throw new Error("Invalid doctor response format");
        }

        // Fetch all doctors
        const allDoctorsResponse = await axios.get(`http://localhost:9999/api/doctor`);
        console.log("All Doctors API Response:", allDoctorsResponse.data);
        const doctors = allDoctorsResponse.data.data || allDoctorsResponse.data || [];
        setAllDoctors(doctors);
        console.log("allDoctors state:", doctors);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        console.log("Error response:", error.response?.data);
        setError("Không thể tải thông tin bác sĩ hoặc danh sách bác sĩ. Vui lòng kiểm tra console để biết thêm chi tiết.");
        setLoading(false);
      }
    };

    fetchData();
  }, [doctorId]);

  if (loading) {
    return <div className="doctordetail-loading">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="doctordetail-error">
        Lỗi: {error}
        <Link to="/doctor" className="btn btn-primary mt-3">Quay lại đội ngũ</Link>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="doctordetail-error">
        Không tìm thấy bác sĩ hoặc tải dữ liệu thất bại. Vui lòng kiểm tra console.
        <Link to="/doctor" className="btn btn-primary mt-3">Quay lại đội ngũ</Link>
      </div>
    );
  }

  return (
    <div className="doctordetail-page">
      <div className="doctordetail-wrapper">
        <div className="doctordetail-main">
          <div className="doctordetail-container">
            <div className="doctordetail-card">
              <div className="doctordetail-header">
                <h1 className="doctordetail-title">
                  {doctor.userId ? `Bác sĩ ${doctor.userId.fullname}` : "Bác sĩ không rõ tên"}
                </h1>
                <div className="doctordetail-meta">
                  <span className="doctordetail-specialty">
                    <PersonIcon fontSize="small" />
                    {doctor.Specialty || "Không rõ"}
                  </span>
                </div>
              </div>
              {doctor.ProfileImage && (
                <div className="doctordetail-image">
                  <img src={doctor.ProfileImage} alt={doctor.userId?.fullname || "Doctor"} />
                </div>
              )}
              <div className="doctordetail-content">
                <p><strong>Phòng khám:</strong> {doctor.clinic_id?.clinic_name || "Không rõ"}</p>
                <p><strong>Trình độ:</strong> {doctor.Degree || "Không rõ"}</p>
                <p><strong>Kinh nghiệm:</strong> {doctor.ExperienceYears ? `${doctor.ExperienceYears} năm` : "Không rõ"}</p>
                <p><strong>Mô tả:</strong> {doctor.Description || "Không có mô tả"}</p>
                <Link to="/doctor" className="doctordetail-read-more">Quay lại đội ngũ</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="doctordetail-sidebar">
          <h3 className="doctordetail-sidebar-title">Đội ngũ bác sĩ</h3>
          <div className="doctordetail-featured-doctors">
            {allDoctors.filter((d) => d.Status !== "inactive" && d._id !== doctor._id).length === 0 ? (
              <p>Không có bác sĩ nào khác.</p>
            ) : (
              allDoctors
                .filter((d) => d.Status !== "inactive" && d._id !== doctor._id)
                .map((otherDoctor, index) => (
                  <div key={index} className="doctordetail-featured-doctor-card">
                    <Link to={`/doctor/${otherDoctor._id}`}>
                      <img
                        src={otherDoctor.ProfileImage || "https://via.placeholder.com/100x100"}
                        alt={otherDoctor.userId?.fullname || "Unknown Doctor"}
                        className="doctordetail-featured-doctor-image"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/100x100")}
                      />
                    </Link>
                    <div className="doctordetail-featured-doctor-content">
                      <Link
                        to={`/doctor/${otherDoctor._id}`}
                        className="doctordetail-featured-doctor-title-link"
                      >
                        <h4 className="doctordetail-featured-doctor-title">
                          {(otherDoctor.userId?.fullname || "Bác sĩ không rõ tên").length > 20
                            ? (otherDoctor.userId?.fullname || "Bác sĩ không rõ tên").substring(0, 20) + "..."
                            : otherDoctor.userId?.fullname || "Bác sĩ không rõ tên"}
                        </h4>
                      </Link>
                      <p className="doctordetail-featured-doctor-excerpt">
                        {truncateText(otherDoctor.Specialty || "Không có chuyên ngành", 50)}
                      </p>
                      <Link
                        to={`/doctor/${otherDoctor._id}`}
                        className="doctordetail-read-more"
                      >
                        Xem hồ sơ
                      </Link>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail;