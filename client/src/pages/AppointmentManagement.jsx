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
  Pagination,
  Typography,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "../assets/css/AppointmentPage.css";

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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

      const sortedAppointments = appointmentRes.data.success
        ? appointmentRes.data.data.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          )
        : [];
      setAppointments(sortedAppointments);
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

  // Tính tổng số trang
  const totalPages = Math.ceil(filteredAppointments.length / rowsPerPage);

  // Hàm lấy dữ liệu trang hiện tại
  const getCurrentPageData = () => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAppointments.slice(startIndex, endIndex);
  };

  // Xử lý thay đổi trang
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Xử lý thay đổi số dòng mỗi trang
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1); // Reset về trang 1 khi thay đổi số dòng
  };

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
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <h2 style={{ margin: 0, marginBottom: "24px" }}>Quản lý lịch đặt</h2>
      <Box sx={{ marginBottom: "16px" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Tìm theo tên bệnh nhân hoặc bác sĩ"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1); // Reset về trang 1 khi search
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "25px",
              backgroundColor: "#f8f9fa",
            },
          }}
        />
      </Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControl size="small" style={{ minWidth: 120 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1); // Reset về trang 1 khi thay đổi bộ lọc
            }}
            label="Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="fully_paid">Fully Paid</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <p style={{ marginBottom: "16px", fontSize: "16px", color: "#555" }}>
        Tổng lịch đặt: {filteredAppointments.length}
        {searchTerm && ` (filtered from ${appointments.length})`}
      </p>
      <div style={{ overflowX: "auto", width: "100%" }}>
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ width: "60px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  STT
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Bệnh nhân
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Dịch vụ
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Phòng khám
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Bác sĩ
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Ngày khám
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Giờ khám
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Trạng thái
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Ngày đặt
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCurrentPageData().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                    {loading ? "Loading..." : searchTerm ? "No matching results found" : "No data found"}
                  </TableCell>
                </TableRow>
              ) : (
                getCurrentPageData().map((appointment, index) => (
                  <TableRow
                    key={appointment._id}
                    sx={{
                      "&:hover": { backgroundColor: "#f9f9f9" },
                      "&:nth-of-type(even)": { backgroundColor: "#fafafa" },
                    }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {(page - 1) * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {appointment.patientId?.userId?.fullname || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {appointment.serviceId?.serviceName || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {appointment.clinicId?.clinic_name || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {appointment.doctorId?.userId?.fullname || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {appointment.timeslotId?.date
                        ? dayjs(appointment.timeslotId.date).format("DD/MM/YYYY")
                        : "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {appointment.timeslotId
                        ? `${appointment.timeslotId.start_time} - ${appointment.timeslotId.end_time}`
                        : "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Chip
                        label={appointment.status.toUpperCase()}
                        color={getStatusColor(appointment.status)}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {appointment.createdAt
                        ? dayjs(appointment.createdAt).format("DD/MM/YYYY HH:mm")
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px",
              marginTop: "20px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Show:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={rowsPerPage}
                  onChange={handleChangeRowsPerPage}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#ddd",
                    },
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" sx={{ color: "#666" }}>
                entries
              </Typography>
            </Box>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handleChangePage}
              shape="rounded"
              size="large"
              showFirstButton
              showLastButton
              sx={{
                "& .MuiPagination-ul": {
                  backgroundColor: "#fff",
                  borderRadius: "25px",
                  padding: "8px 16px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  border: "1px solid #e0e0e0",
                },
                "& .MuiPaginationItem-root": {
                  color: "#666",
                  fontWeight: "500",
                  margin: "0 4px",
                  minWidth: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  "&:hover": {
                    backgroundColor: "#f0f8ff",
                    color: "#1976d2",
                  },
                },
                "& .MuiPaginationItem-page.Mui-selected": {
                  backgroundColor: "#00bcd4",
                  color: "#fff",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#00acc1",
                  },
                },
                "& .MuiPaginationItem-ellipsis": {
                  color: "#999",
                },
                "& .MuiPaginationItem-previousNext": {
                  color: "#00bcd4",
                  fontWeight: "bold",
                  "&.Mui-disabled": {
                    color: "#ccc",
                  },
                },
              }}
            />
            <Typography variant="body2" sx={{ color: "#666" }}>
              Showing {filteredAppointments.length === 0 ? 0 : ((page - 1) * rowsPerPage) + 1} to{" "}
              {Math.min(page * rowsPerPage, filteredAppointments.length)} of {filteredAppointments.length}{" "}
              entries
              {searchTerm && ` (filtered from ${appointments.length} total entries)`}
            </Typography>
          </Box>
        </TableContainer>
      </div>
    </div>
  );
};

export default AppointmentManagement;