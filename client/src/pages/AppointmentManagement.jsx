import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Box,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "../assets/css/AppointmentPage.css";

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const appointmentRes = await axios.get("http://localhost:9999/api/admin/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(appointmentRes.data.success ? appointmentRes.data.data : []);
    } catch (error) {
      console.error("Error fetching data:", error.message);
    }
    setLoading(false);
  };

  // Xử lý thay đổi trạng thái
  const handleStatusChange = async (appointmentId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `http://localhost:9999/api/admin/appointments/${appointmentId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Cập nhật lại danh sách sau khi thay đổi trạng thái
    } catch (error) {
      console.error("Error updating status:", error.message);
    }
  };

  // Lọc và tìm kiếm
  const filteredAppointments = appointments.filter((appointment) => {
    const patientName = appointment.patientId?.userId?.fullname || "";
    const doctorName = appointment.doctorId?.userId?.fullname || "";
    const matchesSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? appointment.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "confirmed":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Appointment Management</h1>
      <Box display="flex" justifyContent="flex-end" mb={2}>
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
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      <p className="total-count mb-4">Total appointments: {filteredAppointments.length}</p>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow style={{ backgroundColor: "#f5f5f5" }}>
              <TableCell width={60}>STT</TableCell>
              <TableCell>Bệnh nhân</TableCell>
              <TableCell>Dịch vụ</TableCell>
              <TableCell>Phòng khám</TableCell>
              <TableCell>Bác sĩ</TableCell>
              <TableCell>Ngày khám</TableCell>
              <TableCell>Giờ khám</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày đặt</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>No appointments found</TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appointment, index) => (
                <TableRow key={appointment._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{appointment.patientId?.userId?.fullname || "N/A"}</TableCell>
                  <TableCell>{appointment.serviceId?.serviceName || "N/A"}</TableCell>
                  <TableCell>{appointment.clinicId?.clinic_name || "N/A"}</TableCell>
                  <TableCell>{appointment.doctorId?.userId?.fullname || "N/A"}</TableCell>
                  <TableCell>
                    {appointment.timeslotId?.date
                      ? dayjs(appointment.timeslotId.date).format("DD/MM/YYYY")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {appointment.timeslotId
                      ? `${appointment.timeslotId.start_time} - ${appointment.timeslotId.end_time}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status.toUpperCase()}
                      color={getStatusColor(appointment.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {appointment.createdAt
                      ? dayjs(appointment.createdAt).format("DD/MM/YYYY HH:mm")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" style={{ minWidth: 120 }}>
                      <InputLabel>Change Status</InputLabel>
                      <Select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                        label="Change Status"
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="confirmed">Confirmed</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AppointmentManagement;