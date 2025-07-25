import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../assets/css/DoctorAccountManagement.css";

const DoctorAccountManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editForm, setEditForm] = useState({
    Specialty: "",
    Degree: "",
    ExperienceYears: "",
    Description: "",
    ProfileImage: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const doctorsPerPage = 3;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      console.error("Lỗi khi phân tích dữ liệu người dùng:", error);
      navigate("/");
      return;
    }

    if (!token || !user || user.role !== "admin") {
      console.log("Chuyển hướng do thiếu token hoặc vai trò không phải admin");
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchDoctors(token), fetchClinics(token)]);
      } catch (err) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const fetchDoctors = async (token) => {
    try {
      const response = await axios.get("http://localhost:9999/api/doctor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Danh sách bác sĩ đã tải:", response.data);
      const doctorData = Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];
      setDoctors(doctorData);
    } catch (error) {
      console.error("Lỗi khi tải danh sách bác sĩ:", error.response?.data || error.message);
      setDoctors([]);
      throw error;
    }
  };

  const fetchClinics = async (token) => {
    try {
      const response = await axios.get("http://localhost:9999/api/clinic", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClinics(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phòng khám:", error);
      setClinics([]);
      throw error;
    }
  };

  const handleChangeStatus = async (doctorId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const response = await axios.put(
        `http://localhost:9999/api/doctor/${doctorId}/status`,
        { Status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.data.success && response.data.data?.Status) {
        setDoctors(
          doctors.map((doctor) =>
            doctor._id === doctorId ? { ...doctor, Status: response.data.data.Status } : doctor
          )
        );
        setMessage(`Trạng thái bác sĩ đã được cập nhật thành ${newStatus === "active" ? "hoạt động" : "không hoạt động"}`);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage("Không thể cập nhật trạng thái bác sĩ.");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái bác sĩ:", error.response?.data || error.message);
      setMessage("Không thể cập nhật trạng thái bác sĩ. Vui lòng thử lại.");
    }
  };

  const handleOpenEditDialog = (doctor) => {
    console.log("Opening edit dialog for doctor:", doctor);
    setSelectedDoctor(doctor);
    setEditForm({
      Specialty: doctor.Specialty || "",
      Degree: doctor.Degree || "",
      ExperienceYears: doctor.ExperienceYears || "",
      Description: doctor.Description || "",
      ProfileImage: doctor.ProfileImage || "",
    });
    setValidationErrors({});
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedDoctor(null);
    setEditForm({
      Specialty: "",
      Degree: "",
      ExperienceYears: "",
      Description: "",
      ProfileImage: "",
    });
    setValidationErrors({});
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to:`, value);
    setEditForm((prev) => ({ ...prev, [name]: value }));
    // Clear validation error for the field being edited
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!editForm.Specialty.trim()) {
      errors.Specialty = "Chuyên môn là bắt buộc";
    }
    if (!editForm.Degree.trim()) {
      errors.Degree = "Bằng cấp là bắt buộc";
    }
    if (!editForm.ExperienceYears || editForm.ExperienceYears < 0) {
      errors.ExperienceYears = "Số năm kinh nghiệm phải là số không âm";
    }
    if (!editForm.Description.trim()) {
      errors.Description = "Mô tả là bắt buộc";
    }
    if (!editForm.ProfileImage) {
      errors.ProfileImage = "Ảnh đại diện là bắt buộc";
    }
    return errors;
  };

  const handleEditDoctor = async () => {
    if (!selectedDoctor) return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setMessage("Vui lòng điền đầy đủ tất cả các trường bắt buộc.");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Specialty", editForm.Specialty);
      formData.append("Degree", editForm.Degree);
      formData.append("ExperienceYears", editForm.ExperienceYears);
      formData.append("Description", editForm.Description);
      console.log("ProfileImage value:", editForm.ProfileImage);
      if (editForm.ProfileImage instanceof File) {
        formData.append("ProfileImage", editForm.ProfileImage);
      } else {
        formData.append("ProfileImage", editForm.ProfileImage);
      }

      const response = await axios.put(
        `http://localhost:9999/api/doctor/${selectedDoctor._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Update response:", response.data);

      if (response.data.success) {
        setDoctors(
          doctors.map((doctor) =>
            doctor._id === selectedDoctor._id ? { ...doctor, ...response.data.data } : doctor
          )
        );
        await fetchDoctors(localStorage.getItem("token"));
        setMessage("Cập nhật bác sĩ thành công");
        setTimeout(() => setMessage(null), 3000);
        handleCloseEditDialog();
      } else {
        setMessage("Không thể cập nhật bác sĩ.");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật bác sĩ:", error.response?.data || error.message);
      setMessage("Không thể cập nhật bác sĩ. Vui lòng thử lại.");
    }
  };

  const truncateDescription = (description) => {
    if (!description) return "N/A";
    return description.length > 30 ? `${description.slice(0, 30)}...` : description;
  };

  const filteredDoctors = selectedClinic
    ? doctors.filter((doctor) => doctor.clinic_id?._id === selectedClinic)
    : doctors;

  const paginatedDoctors = filteredDoctors.slice(
    (page - 1) * doctorsPerPage,
    page * doctorsPerPage
  );

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <div className="doctor-account-management">
      <h1>Quản Lý Thông Tin Bác Sĩ</h1>
      <p>Tổng số bác sĩ: {filteredDoctors.length}</p>
      {loading && <p>Đang tải...</p>}
      {error && <p className="message error">{error}</p>}
      {message && (
        <p className={`message ${message.includes("Không thể") || message.includes("Vui lòng") ? "error" : "success"}`}>
          {message}
        </p>
      )}
      <FormControl fullWidth style={{ marginBottom: "20px", maxWidth: "300px" }}>
        <InputLabel>Lọc theo Phòng Khám</InputLabel>
        <Select
          value={selectedClinic}
          onChange={(e) => {
            setSelectedClinic(e.target.value);
            setPage(1);
          }}
          label="Lọc theo Phòng Khám"
        >
          <MenuItem value="">Tất Cả Phòng Khám</MenuItem>
          {clinics.map((clinic) => (
            <MenuItem key={clinic._id} value={clinic._id}>
              {clinic.clinic_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Họ và Tên</TableCell>
              <TableCell>Tên Phòng Khám</TableCell>
              <TableCell>Chuyên Môn</TableCell>
              <TableCell>Bằng Cấp</TableCell>
              <TableCell>Kinh Nghiệm (Năm)</TableCell>
              <TableCell>Mô Tả</TableCell>
              <TableCell>Trạng Thái</TableCell>
              <TableCell>Ảnh Đại Diện</TableCell>
              <TableCell>Hành Động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>Đang tải...</TableCell>
              </TableRow>
            ) : paginatedDoctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>Không tìm thấy bác sĩ</TableCell>
              </TableRow>
            ) : (
              paginatedDoctors.map((doctor) => (
                <TableRow key={doctor._id}>
                  <TableCell>{doctor.userId?.fullname || "N/A"}</TableCell>
                  <TableCell>{doctor.clinic_id?.clinic_name || "N/A"}</TableCell>
                  <TableCell>{doctor.Specialty || "N/A"}</TableCell>
                  <TableCell>{doctor.Degree || "N/A"}</TableCell>
                  <TableCell>{doctor.ExperienceYears || "N/A"}</TableCell>
                  <TableCell>{truncateDescription(doctor.Description)}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color={doctor.Status === "active" ? "primary" : "secondary"}
                      onClick={() => handleChangeStatus(doctor._id, doctor.Status)}
                      size="small"
                      className="status-button"
                      sx={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        minWidth: '60px',
                      }}
                      aria-label={`Đặt trạng thái bác sĩ thành ${doctor.Status === "active" ? "không hoạt động" : "hoạt động"}`}
                    >
                      {doctor.Status === "active" ? "Hoạt động" : "Không hoạt động"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {doctor.ProfileImage ? (
                      <img
                        src={doctor.ProfileImage}
                        alt="Ảnh Đại Diện"
                        className="profile-image"
                      />
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleOpenEditDialog(doctor)}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        minWidth: '60px',
                      }}
                      aria-label={`Chỉnh sửa bác sĩ ${doctor.userId?.fullname || "N/A"}`}
                    >
                      Chỉnh Sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination
        count={Math.ceil(filteredDoctors.length / doctorsPerPage)}
        page={page}
        onChange={handlePageChange}
        sx={{ mt: 2, display: "flex", justifyContent: "center" }}
      />
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        BackdropProps={{ style: { backgroundColor: 'transparent' } }}
        sx={{
          zIndex: 10000,
          '& .MuiDialog-paper': {
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            marginTop: '150px',
            position: 'relative',
            maxWidth: '600px',
            width: '90%',
          },
          '@media (max-width: 600px)': {
            '& .MuiDialog-paper': {
              marginTop: '120px',
              width: '95%',
              maxWidth: '100%',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#06A3DA',
            padding: '16px 24px',
            borderBottom: '1px solid #E6F0FA',
            '@media (max-width: 600px)': {
              fontSize: '1.2rem',
              padding: '12px 16px',
            },
          }}
        >
          Chỉnh Sửa Bác Sĩ
        </DialogTitle>
        <DialogContent
          sx={{
            fontFamily: "'Jost', sans-serif",
            padding: '24px',
            color: '#091E3E',
            '@media (max-width: 600px)': {
              padding: '16px',
            },
          }}
        >
          <TextField
            margin="dense"
            name="Specialty"
            label="Chuyên Môn"
            type="text"
            fullWidth
            value={editForm.Specialty}
            onChange={handleEditFormChange}
            required
            error={!!validationErrors.Specialty}
            helperText={validationErrors.Specialty}
            sx={{
              marginBottom: '16px',
              '& .MuiInputBase-root': {
                fontFamily: "'Jost', sans-serif",
                fontSize: '0.95rem',
                borderRadius: '8px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#06A3DA',
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#F57E57',
              },
              '& .MuiInputLabel-root': {
                fontFamily: "'Jost', sans-serif",
                color: '#6c757d',
              },
            }}
          />
          <TextField
            margin="dense"
            name="Degree"
            label="Bằng Cấp"
            type="text"
            fullWidth
            value={editForm.Degree}
            onChange={handleEditFormChange}
            required
            error={!!validationErrors.Degree}
            helperText={validationErrors.Degree}
            sx={{
              marginBottom: '16px',
              '& .MuiInputBase-root': {
                fontFamily: "'Jost', sans-serif",
                fontSize: '0.95rem',
                borderRadius: '8px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#06A3DA',
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#F57E57',
              },
              '& .MuiInputLabel-root': {
                fontFamily: "'Jost', sans-serif",
                color: '#6c757d',
              },
            }}
          />
          <TextField
            margin="dense"
            name="ExperienceYears"
            label="Số Năm Kinh Nghiệm"
            type="number"
            fullWidth
            value={editForm.ExperienceYears}
            onChange={handleEditFormChange}
            required
            error={!!validationErrors.ExperienceYears}
            helperText={validationErrors.ExperienceYears}
            inputProps={{ min: 0 }}
            sx={{
              marginBottom: '16px',
              '& .MuiInputBase-root': {
                fontFamily: "'Jost', sans-serif",
                fontSize: '0.95rem',
                borderRadius: '8px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#06A3DA',
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#F57E57',
              },
              '& .MuiInputLabel-root': {
                fontFamily: "'Jost', sans-serif",
                color: '#6c757d',
              },
            }}
          />
          <TextField
            margin="dense"
            name="Description"
            label="Mô Tả"
            type="text"
            fullWidth
            value={editForm.Description}
            onChange={handleEditFormChange}
            multiline
            rows={4}
            required
            error={!!validationErrors.Description}
            helperText={validationErrors.Description}
            sx={{
              marginBottom: '16px',
              '& .MuiInputBase-root': {
                fontFamily: "'Jost', sans-serif",
                fontSize: '0.95rem',
                borderRadius: '8px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#06A3DA',
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#F57E57',
              },
              '& .MuiInputLabel-root': {
                fontFamily: "'Jost', sans-serif",
                color: '#6c757d',
              },
            }}
          />
          <input
            type="file"
            accept="image/*"
            name="ProfileImage"
            onChange={(e) => {
              console.log("Tệp đã chọn:", e.target.files[0]);
              setEditForm((prev) => ({ ...prev, ProfileImage: e.target.files[0] }));
              setValidationErrors((prev) => ({ ...prev, ProfileImage: "" }));
            }}
            style={{
              marginTop: '16px',
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.95rem',
              padding: '8px',
              border: '1px solid #06A3DA',
              borderRadius: '8px',
              backgroundColor: '#fff',
              width: '100%',
              cursor: 'pointer',
              '@media (max-width: 600px)': {
                fontSize: '0.85rem',
              },
            }}
          />
          {validationErrors.ProfileImage && (
            <p style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '8px' }}>
              {validationErrors.ProfileImage}
            </p>
          )}
          {editForm.ProfileImage && typeof editForm.ProfileImage === "string" && (
            <img
              src={editForm.ProfileImage}
              alt="Ảnh Đại Diện Hiện Tại"
              style={{
                maxWidth: '100px',
                height: 'auto',
                borderRadius: '4px',
                marginTop: '10px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            />
          )}
        </DialogContent>
        <DialogActions
          sx={{
            padding: '16px 24px',
            borderTop: '1px solid #E6F0FA',
            '@media (max-width: 600px)': {
              padding: '12px 16px',
            },
          }}
        >
          <Button
            onClick={handleCloseEditDialog}
            sx={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#F57E57',
              '@media (max-width: 600px)': {
                fontSize: '0.9rem',
                padding: '6px 12px',
              },
              '&:hover': {
                backgroundColor: '#E6F0FA',
              },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleEditDoctor}
            sx={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              backgroundColor: '#06A3DA',
              color: '#fff',
              '@media (max-width: 600px)': {
                fontSize: '0.9rem',
                padding: '6px 12px',
              },
              '&:hover': {
                backgroundColor: '#F57E57',
              },
            }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DoctorAccountManagement;