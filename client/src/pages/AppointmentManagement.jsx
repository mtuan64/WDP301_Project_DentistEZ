import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  Box,
  InputLabel,
  FormControl,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../assets/css/AppointmentPage.css"; 

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentAppointment, setCurrentAppointment] = useState({
    _id: "",
    PatientId: "",
    DoctorId: "",
    StaffId: "",
    serviceid: "",
    clinic_id: "",
    AppointmentDate: "",
    AppointmentTime: "",
    Status: "pending",
    Note: "",
  });
  const navigate = useNavigate();

  // Kiểm tra xác thực và lấy dữ liệu
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user || user.role !== "admin") {
      navigate("/");
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const [appointmentRes, patientRes, doctorRes, staffRes, serviceRes, clinicRes] = await Promise.all([
        axios.get("http://localhost:9999/api/admin/appointments", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => ({ data: { success: false, data: [] } })),
        axios.get("http://localhost:9999/api/patients", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => ({ data: { success: false, data: [] } })),
        axios.get("http://localhost:9999/api/doctor", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => ({ data: { success: false, data: [] } })),
        axios.get("http://localhost:9999/api/staff", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => ({ data: { success: false, data: [] } })),
        axios.get("http://localhost:9999/api/services", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => ({ data: { success: false, data: [] } })),
        axios.get("http://localhost:9999/api/clinics", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => ({ data: { success: false, data: [] } })),
      ]);

      setAppointments(appointmentRes.data.success ? appointmentRes.data.data : []);
      setPatients(patientRes.data.success ? patientRes.data.data : []);
      setDoctors(doctorRes.data.success ? doctorRes.data.data : []);
      setStaff(staffRes.data.success ? staffRes.data.data : []);
      setServices(serviceRes.data.success ? serviceRes.data.data : []);
      setClinics(clinicRes.data.success ? clinicRes.data.data : []);
    } catch (error) {
      showSnackbar("Error fetching data: " + error.message, "error");
    }
  };

  // Hiển thị thông báo
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Mở form thêm/chỉnh sửa
  const handleOpen = (appointment = null) => {
    if (appointment) {
      setEditMode(true);
      setCurrentAppointment({
        _id: appointment._id,
        PatientId: appointment.PatientId._id,
        DoctorId: appointment.DoctorId._id,
        StaffId: appointment.StaffId._id,
        serviceid: appointment.serviceid._id,
        clinic_id: appointment.clinic_id._id,
        AppointmentDate: new Date(appointment.AppointmentDate).toISOString().split("T")[0],
        AppointmentTime: appointment.AppointmentTime,
        Status: appointment.Status,
        Note: appointment.Note || "",
      });
    } else {
      setEditMode(false);
      setCurrentAppointment({
        _id: "",
        PatientId: "",
        DoctorId: "",
        StaffId: "",
        serviceid: "",
        clinic_id: "",
        AppointmentDate: "",
        AppointmentTime: "",
        Status: "pending",
        Note: "",
      });
    }
    setOpen(true);
  };

  // Đóng form
  const handleClose = () => {
    setOpen(false);
  };

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAppointment((prev) => ({ ...prev, [name]: value }));
  };

  // Thêm hoặc cập nhật cuộc hẹn
  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    try {
      const appointmentData = {
        ...currentAppointment,
        AppointmentDate: new Date(currentAppointment.AppointmentDate).toISOString(),
      };
      let response;
      if (editMode) {
        response = await axios.put(
          `http://localhost:9999/api/admin/appointments/${currentAppointment._id}`,
          appointmentData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          "http://localhost:9999/api/admin/appointments",
          appointmentData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        showSnackbar(response.data.message, "success");
        fetchData();
        handleClose();
      } else {
        showSnackbar(response.data.message, "error");
      }
    } catch (error) {
      showSnackbar("Error saving appointment: " + error.message, "error");
    }
  };

  // Xóa cuộc hẹn
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        const response = await axios.delete(`http://localhost:9999/api/admin/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          showSnackbar(response.data.message, "success");
          fetchData();
        } else {
          showSnackbar(response.data.message, "error");
        }
      } catch (error) {
        showSnackbar("Error deleting appointment: " + error.message, "error");
      }
    }
  };

  // Lọc và tìm kiếm
  const filteredAppointments = appointments.filter((appointment) => {
    const patientName = appointment.PatientId?.name || "";
    const doctorName = appointment.DoctorId?.name || "";
    const matchesSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? appointment.Status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="user-list-page">
      <h1 className="page-title">Admin Dashboard - Appointment Management</h1>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
        >
          Add Appointment +
        </Button>
        <Box display="flex" gap={2}>
          <TextField
            label="Search by Patient/Doctor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
          />
          <FormControl size="small" style={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      <p className="total-count">Total appointments: {filteredAppointments.length}</p>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow style={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>No.</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Staff</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Clinic</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>No appointments found</TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appointment, index) => (
                <TableRow key={appointment._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{appointment.PatientId?.name || "N/A"}</TableCell>
                  <TableCell>{appointment.DoctorId?.name || "N/A"}</TableCell>
                  <TableCell>{appointment.StaffId?.name || "N/A"}</TableCell>
                  <TableCell>{appointment.serviceid?.name || "N/A"}</TableCell>
                  <TableCell>{appointment.clinic_id?.name || "N/A"}</TableCell>
                  <TableCell>
                    {new Date(appointment.AppointmentDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{appointment.AppointmentTime}</TableCell>
                  <TableCell>{appointment.Status}</TableCell>
                  <TableCell>{appointment.Note || "N/A"}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(appointment)}>
                      <EditIcon style={{ color: "green" }} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(appointment._id)}>
                      <DeleteIcon style={{ color: "red" }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog để thêm/chỉnh sửa */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? "Edit Appointment" : "Add Appointment"}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Patient</InputLabel>
            <Select
              name="PatientId"
              value={currentAppointment.PatientId}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="">Select Patient</MenuItem>
              {patients.map((patient) => (
                <MenuItem key={patient._id} value={patient._id}>
                  {patient.userId?.fullname || patient.name || "N/A"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Doctor</InputLabel>
            <Select
              name="DoctorId"
              value={currentAppointment.DoctorId}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="">Select Doctor</MenuItem>
              {doctors.map((doctor) => (
                <MenuItem key={doctor._id} value={doctor._id}>
                  {doctor.userId?.fullname || doctor.name || "N/A"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Staff</InputLabel>
            <Select
              name="StaffId"
              value={currentAppointment.StaffId}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="">Select Staff</MenuItem>
              {staff.map((member) => (
                <MenuItem key={member._id} value={member._id}>
                  {member.userId?.fullname || member.name || "N/A"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Service</InputLabel>
            <Select
              name="serviceid"
              value={currentAppointment.serviceid}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="">Select Service</MenuItem>
              {services.map((service) => (
                <MenuItem key={service._id} value={service._id}>
                  {service.name || "N/A"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Clinic</InputLabel>
            <Select
              name="clinic_id"
              value={currentAppointment.clinic_id}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="">Select Clinic</MenuItem>
              {clinics.map((clinic) => (
                <MenuItem key={clinic._id} value={clinic._id}>
                  {clinic.name || "N/A"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="AppointmentDate"
            label="Appointment Date"
            type="date"
            fullWidth
            value={currentAppointment.AppointmentDate}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            margin="dense"
            name="AppointmentTime"
            label="Appointment Time (HH:mm)"
            fullWidth
            value={currentAppointment.AppointmentTime}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              name="Status"
              value={currentAppointment.Status}
              onChange={handleInputChange}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="Note"
            label="Note"
            fullWidth
            value={currentAppointment.Note}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            {editMode ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AppointmentManagement;