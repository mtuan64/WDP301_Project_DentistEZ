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
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../assets/css/AppointmentPage.css";

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
      const appointmentRes = await axios.get("http://localhost:9999/api/admin/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(appointmentRes.data.success ? appointmentRes.data.data : []);
    } catch (error) {
      console.error("Error fetching data:", error.message);
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

  return (
    <div className="user-list-page">
      <h1 className="page-title">Appointment Management</h1>
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
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="fully_paid">Fully Paid</MenuItem>
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
              <TableCell>Service</TableCell>
              <TableCell>Clinic</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Note</TableCell>
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
                  <TableCell>{appointment.doctorId?.userId?.fullname || "N/A"}</TableCell>                  <TableCell>{appointment.serviceId?.serviceName || "N/A"}</TableCell>
                  <TableCell>{appointment.clinicId?.clinic_name || "N/A"}</TableCell>
                  <TableCell>
                    {appointment.timeslotId?.date
                      ? new Date(appointment.timeslotId.date).toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        })
                      : "N/A"}
                  </TableCell>
                  <TableCell>{appointment.timeslotId?.start_time || "N/A"}</TableCell>
                  <TableCell>{appointment.status}</TableCell>
                  <TableCell>{appointment.note || "N/A"}</TableCell>
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