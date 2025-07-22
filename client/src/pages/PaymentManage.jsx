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

const PaymentManage = () => {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user || user.role !== "admin") {
      navigate("/");
      return;
    }

    fetchPayments();
  }, [navigate]);

  const fetchPayments = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:9999/api/admin/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const sortedPayments = res.data.data.payments.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setPayments(sortedPayments);
      }
    } catch (error) {
      console.error("Error fetching payments:", error.message);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const patientName = payment.metaData?.patient || "";
    const doctorName = payment.metaData?.doctor || "";
    const matchSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter ? payment.status === statusFilter : true;
    const matchType = typeFilter ? payment.type === typeFilter : true;
    const matchMethod = methodFilter ? payment.paymentMethod === methodFilter : true;

    return matchSearch && matchStatus && matchType && matchMethod;
  });

  // Calculate total pages
  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredPayments.slice(startIndex, endIndex);
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1); // Reset to page 1 when changing rows per page
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "paid":
        return "success";
      case "canceled":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <h2 style={{ margin: 0, marginBottom: "24px" }}>Quản lý thanh toán</h2>

      <Box sx={{ marginBottom: "16px" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by Patient/Doctor..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1); // Reset to page 1 when searching
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

      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <FormControl size="small" style={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1); // Reset to page 1 when changing filter
            }}
            label="Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="canceled">Canceled</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" style={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1); // Reset to page 1 when changing filter
            }}
            label="Type"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="deposit">Deposit</MenuItem>
            <MenuItem value="final">Final</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" style={{ minWidth: 120 }}>
          <InputLabel>Method</InputLabel>
          <Select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1); // Reset to page 1 when changing filter
            }}
            label="Method"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <p style={{ marginBottom: "16px", fontSize: "16px", color: "#555" }}>
        Total payments: {filteredPayments.length}
        {searchTerm && ` (filtered from ${payments.length})`}
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
                  Bác sĩ
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Dịch vụ
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Phòng khám
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Số tiền
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Trạng thái
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Loại
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Phương thức
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Ngày tạo
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCurrentPageData().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} style={{ textAlign: "center", padding: "40px" }}>
                    {searchTerm ? "No matching results found" : "No data found"}
                  </TableCell>
                </TableRow>
              ) : (
                getCurrentPageData().map((payment, index) => (
                  <TableRow
                    key={payment._id}
                    sx={{
                      "&:hover": { backgroundColor: "#f9f9f9" },
                      "&:nth-of-type(even)": { backgroundColor: "#fafafa" },
                    }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {(page - 1) * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {payment.metaData?.patient || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {payment.metaData?.doctor || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {payment.metaData?.service || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {payment.metaData?.clinic || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {payment.amount.toLocaleString("vi-VN")} đ
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Chip
                        label={payment.status.toUpperCase()}
                        color={getStatusColor(payment.status)}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {payment.type}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {payment.paymentMethod}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {payment.createdAt
                        ? dayjs(payment.createdAt).format("DD/MM/YYYY HH:mm")
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
              Showing {filteredPayments.length === 0 ? 0 : ((page - 1) * rowsPerPage) + 1} to{" "}
              {Math.min(page * rowsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
              {searchTerm && ` (filtered from ${payments.length} total entries)`}
            </Typography>
          </Box>
        </TableContainer>
      </div>
    </div>
  );
};

export default PaymentManage;