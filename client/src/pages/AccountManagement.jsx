import React, { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert, 
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, 
  Box, Typography, Pagination, InputAdornment 
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

const API_ENDPOINTS = {
  doctor: "http://localhost:9999/api/admin-accountdoctor",
  patient: "http://localhost:9999/api/admin-accountpatient",
  staff: "http://localhost:9999/api/admin-accountstaff",
};

const AccountManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    clinic_id: "",
  });
  const [openStaffDialog, setOpenStaffDialog] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    fullname: "",
    email: "",
    password: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /*** MODAL STATE & FN FOR ALERT/CONFIRM ***/
  const [notice, setNotice] = useState({
    open: false,
    content: "",
    title: "",
    type: "alert", // "alert" hoặc "confirm"
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (message) => {
    setNotice({
      open: true,
      content: message,
      title: "Thông báo",
      type: "alert",
      onConfirm: () => setNotice(n => ({ ...n, open: false })),
      onCancel: null
    });
  };

  const showConfirm = (message, onConfirm, onCancel) => {
    setNotice({
      open: true,
      content: message,
      title: "Xác nhận",
      type: "confirm",
      onConfirm: () => { setNotice(n => ({ ...n, open: false })); onConfirm && onConfirm(); },
      onCancel: () => { setNotice(n => ({ ...n, open: false })); onCancel && onCancel(); }
    });
  };
  /*****************************************/

  const getFilteredData = () => {
    if (!searchTerm) return data;
    return data.filter(user =>
      user.userId?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const getCurrentPageData = () => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const fetchData = async () => {
    if (selectedRole === "all") {
      setLoading(true);
      try {
        const [doctorRes, patientRes, staffRes] = await Promise.all([
          axios.get(API_ENDPOINTS.doctor, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          axios.get(API_ENDPOINTS.patient, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          axios.get(API_ENDPOINTS.staff, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
        ]);
        const allData = [
          ...(doctorRes.data.success ? doctorRes.data.data : []),
          ...(patientRes.data.success ? patientRes.data.data : []),
          ...(staffRes.data.success ? staffRes.data.data : []),
        ];
        setData(allData);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Không thể lấy dữ liệu");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const response = await axios.get(API_ENDPOINTS[selectedRole], {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (response.data.success) {
          setData(response.data.data);
          setError("");
        } else {
          setError(response.data.message || "Không thể lấy dữ liệu");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Không thể lấy dữ liệu");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    fetchClinics();
    // eslint-disable-next-line
  }, [selectedRole]);

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
    setPage(1);
    setError("");
  };

  const handleChangeStatus = async (recordId, currentStatus, userRole) => {
    const normalizedStatus = currentStatus?.toLowerCase();
    const newStatus = normalizedStatus === 'active' ? 'inactive' : 'active';
    const roleVN = userRole === "doctor" ? "bác sĩ"
      : userRole === "staff" ? "nhân viên"
      : userRole === "patient" ? "bệnh nhân"
      : "người dùng";

    showConfirm(
      `Bạn có chắc chắn muốn ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} ${roleVN} này không?`,
      async () => {
        try {
          setLoading(true);

          const response = await axios.patch(
            `http://localhost:9999/api/admin/update-status/${userRole}/${recordId}`,
            { Status: newStatus },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                'Content-Type': 'application/json'
              },
            }
          );

          if (response.data.success) {
            setData(prevData =>
              prevData.map(item =>
                item._id === recordId
                  ? { ...item, Status: newStatus }
                  : item
              ));
            showAlert(`Cập nhật trạng thái ${roleVN} thành công!`);
            setError('');
          }
        } catch (error) {
          setError(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
          showAlert(error.response?.data?.message || "Cập nhật trạng thái thất bại");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const fetchClinics = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/clinic", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) {
        setClinics(response.data.data);
      }
    } catch (error) {}
  };

  const handleCreateDoctor = async () => {
    if (!formData.fullname.trim()) {
      showAlert("Vui lòng nhập họ tên.");
      return;
    }
    if (!formData.email.trim()) {
      showAlert("Vui lòng nhập email.");
      return;
    }
    if (!formData.password.trim()) {
      showAlert("Vui lòng nhập mật khẩu.");
      return;
    }
    if (!formData.clinic_id || !formData.clinic_id.trim()) {
      showAlert("Vui lòng chọn phòng khám.");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:9999/api/admin/create-account-doctor",
        {
          ...formData,
          role: "doctor"
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setOpenDialog(false);
        setFormData({ fullname: "", email: "", password: "", clinic_id: "" });
        showAlert("Tạo tài khoản bác sĩ thành công!");
        await fetchData();
      }
    } catch (error) {
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        const errorMsg = error.response.data?.error;
        if (errorMsg === "Email đã được đăng ký") {
          showAlert("Email này đã được đăng ký.");
        } else if (errorMsg === "Phòng này đã được sử dụng bởi bác sĩ khác") {
          showAlert("Phòng khám này đã có bác sĩ sử dụng.");
        } else {
          showAlert(`Lỗi: ${errorMsg || "Tạo tài khoản thất bại!"}`);
        }
      } else {
        showAlert("Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!staffFormData.fullname.trim()) {
      showAlert("Vui lòng nhập họ tên.");
      return;
    }
    if (!staffFormData.email.trim()) {
      showAlert("Vui lòng nhập email.");
      return;
    }
    if (!staffFormData.password.trim()) {
      showAlert("Vui lòng nhập mật khẩu.");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:9999/api/admin/create-account-staff",
        {
          ...staffFormData,
          role: "staff"
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setOpenStaffDialog(false);
        setStaffFormData({ fullname: "", email: "", password: "" });
        showAlert("Tạo tài khoản nhân viên thành công!");
        await fetchData();
      }
    } catch (error) {
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        const errorMsg = error.response.data?.error;
        if (errorMsg === "Email đã được đăng ký") {
          showAlert("Email này đã được đăng ký.");
        } else {
          showAlert(`Lỗi: ${errorMsg || "Tạo tài khoản nhân viên thất bại!"}`);
        }
      } else {
        showAlert("Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const startIndex = (page - 1) * rowsPerPage;

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ margin: 0 }}>Quản lý tài khoản người dùng </h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <FormControl variant="outlined" size="small" style={{ width: "150px" }}>
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              value={selectedRole}
              onChange={handleRoleChange}
            >
              <MenuItem value="all">Tất Cả </MenuItem>
              <MenuItem value="doctor">Bác Sĩ </MenuItem>
              <MenuItem value="patient">Bệnh Nhân </MenuItem>
              <MenuItem value="staff">Nhân Viên </MenuItem>
            </Select>
          </FormControl>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              style={{ whiteSpace: "nowrap", minWidth: "140px", textTransform: "none" }}
              onClick={() => setOpenDialog(true)}
            >
              Thêm Bác Sĩ 
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              style={{ whiteSpace: "nowrap", minWidth: "140px", textTransform: "none" }}
              onClick={() => setOpenStaffDialog(true)}
            >
              Thêm Nhân Viên
            </Button>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <Box sx={{ marginBottom: "16px" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Tìm kiếm theo tên, email, tên đăng nhập hoặc vai trò..."
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
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px',
              backgroundColor: '#f8f9fa',
            },
          }}
        />
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" style={{ marginBottom: "16px" }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && <CircularProgress style={{ display: "block", margin: "20px auto" }} />}

      {/* User Count */}
      <p style={{ marginBottom: "16px", fontSize: "16px", color: "#555" }}>
        Tổng số người dùng: {filteredData.length}
        {searchTerm && ` (lọc từ ${data.length})`}
      </p>

      {/* Table */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <TableContainer
          component={Paper}
          sx={{
            minWidth: 1200,
            boxShadow: 3
          }}
        >
          <Table sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ width: "60px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  STT
                </TableCell>
                <TableCell sx={{ width: "120px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Tên Tài Khoản
                </TableCell>
                <TableCell sx={{ width: "150px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Họ Tên
                </TableCell>
                <TableCell sx={{ width: "200px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Email
                </TableCell>
                <TableCell sx={{ width: "80px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Vai trò 
                </TableCell>
                <TableCell sx={{ width: "120px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  SĐT
                </TableCell>
                <TableCell sx={{ width: "180px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Địa Chỉ
                </TableCell>
                <TableCell sx={{ width: "100px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Trạng Thái
                </TableCell>
                <TableCell sx={{ width: "140px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Thao Tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                    {loading ? "Đang tải..." : searchTerm ? "Không tìm thấy kết quả phù hợp" : "Không có dữ liệu"}
                  </TableCell>
                </TableRow>
              ) : (
                getCurrentPageData().map((user, index) => (
                  <TableRow
                    key={user._id}
                    sx={{
                      '&:hover': { backgroundColor: '#f9f9f9' },
                      '&:nth-of-type(even)': { backgroundColor: '#fafafa' }
                    }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {user.userId?.username || "N/A"}
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {user.userId?.fullname || "N/A"}
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {user.userId?.email || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {user.userId?.role || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {user.userId?.phone || "N/A"}
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {user.userId?.address || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          backgroundColor: user.Status === "active" ? "#e8f5e9" : "#ffebee",
                          color: user.Status === "active" ? "#2e7d32" : "#c62828",
                          fontWeight: 500,
                          fontSize: "12px"
                        }}
                      >
                        {user.Status?.toLowerCase() === "active" ? "Hoạt động" : user.Status?.toLowerCase() === "inactive" ? "Vô hiệu hóa" : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Button
                        variant="contained"
                        color={user.Status?.toLowerCase() === 'active' ? 'error' : 'success'}
                        size="small"
                        onClick={() => handleChangeStatus(
                          user._id,
                          user.Status,
                          user.userId?.role || selectedRole
                        )}
                        disabled={loading}
                        style={{
                          minWidth: "120px",
                          textTransform: "none",
                          fontSize: "12px"
                        }}
                      >
                        {loading ? 'Đang Cập Nhật ...' : 'Thay Đổi Trạng Thái'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Custom Pagination */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              marginTop: '20px'
            }}
          >
            {/* Rows per page selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Show:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={rowsPerPage}
                  onChange={handleChangeRowsPerPage}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ddd',
                    },
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" sx={{ color: '#666' }}>
                entries
              </Typography>
            </Box>

            {/* Pagination component */}
            <Pagination
              count={totalPages}
              page={page}
              onChange={handleChangePage}
              shape="rounded"
              size="large"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPagination-ul': {
                  backgroundColor: '#fff',
                  borderRadius: '25px',
                  padding: '8px 16px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0',
                },
                '& .MuiPaginationItem-root': {
                  color: '#666',
                  fontWeight: '500',
                  margin: '0 4px',
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  '&:hover': {
                    backgroundColor: '#f0f8ff',
                    color: '#1976d2',
                  },
                },
                '& .MuiPaginationItem-page.Mui-selected': {
                  backgroundColor: '#00bcd4',
                  color: '#fff',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#00acc1',
                  },
                },
                '& .MuiPaginationItem-ellipsis': {
                  color: '#999',
                },
                '& .MuiPaginationItem-previousNext': {
                  color: '#00bcd4',
                  fontWeight: 'bold',
                  '&.Mui-disabled': {
                    color: '#ccc',
                  },
                },
              }}
            />

            {/* Thông tin trang */}
            <Typography variant="body2" sx={{ color: '#666' }}>
              Hiển thị {filteredData.length === 0 ? 0 : ((page - 1) * rowsPerPage) + 1} đến {Math.min(page * rowsPerPage, filteredData.length)} trên {filteredData.length} bản ghi
              {searchTerm && ` (lọc từ ${data.length} bản ghi gốc)`}
            </Typography>
          </Box>
        </TableContainer>
      </div>

      {/* Add Doctor Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Thêm Bác Sĩ </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Họ Tên"
            margin="normal"
            value={formData.fullname}
            type="text"
            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
            autoComplete="off"
            required
          />
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            autoComplete="off"
            required
          />
          <TextField
            fullWidth
            label="Mật Khẩu"
            margin="normal"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            autoComplete="off"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Phòng Khám </InputLabel>
            <Select
              value={formData.clinic_id}
              label="Clinic"
              onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
            >
              {clinics.map((clinic) => (
                <MenuItem key={clinic._id} value={clinic._id}>
                  {clinic.clinic_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy </Button>
          <Button
            onClick={handleCreateDoctor}
            variant="contained"
            color="primary"
          >
            Tạo Mới
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={openStaffDialog} onClose={() => setOpenStaffDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Nhân Viên</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Họ Tên"
            margin="normal"
            value={staffFormData.fullname}
            type="text"
            onChange={(e) => setStaffFormData({ ...staffFormData, fullname: e.target.value })}
            autoComplete="off"
            required
          />
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            type="email"
            value={staffFormData.email}
            onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
            autoComplete="off"
            required
          />
          <TextField
            fullWidth
            label="Mật Khẩu"
            margin="normal"
            type="password"
            value={staffFormData.password}
            onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
            autoComplete="new-password"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStaffDialog(false)} disabled={loading}>
            Huỷ         
          </Button>
          <Button
            onClick={handleCreateStaff}
            variant="contained"
            color="secondary"
            disabled={loading}
          >
            {loading ? "Đang Tạo..." : "Tạo Mới"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Notice for Alert/Confirm */}
      <Dialog open={notice.open} onClose={() => setNotice(n => ({ ...n, open: false }))}>
        <DialogTitle>{notice.title}</DialogTitle>
        <DialogContent>
          <Typography>{notice.content}</Typography>
        </DialogContent>
        <DialogActions>
          {notice.type === "confirm" ? (
            <>
              <Button onClick={notice.onCancel} color="inherit">
                Hủy
              </Button>
              <Button onClick={notice.onConfirm} color="primary" variant="contained">
                Đồng ý
              </Button>
            </>
          ) : (
            <Button onClick={notice.onConfirm} color="primary" variant="contained">
              OK
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AccountManagement;
