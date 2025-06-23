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

  // Hàm lọc dữ liệu theo search term
  const getFilteredData = () => {
    if (!searchTerm) return data;
    return data.filter(user =>
      user.userId?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Tính tổng số trang dựa trên dữ liệu đã lọc
  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Hàm lấy dữ liệu trang hiện tại
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

  // Hàm hiển thị thông báo confirm
  const showConfirm = (message) => {
    return window.confirm(message);
  };

  // Hàm hiển thị thông báo alert
  const showAlert = (message) => {
    window.alert(message);
  };

  const fetchData = async () => {
    console.log("Fetching data for role:", selectedRole);

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
        setError(err.response?.data?.message || "Failed to fetch data");
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
          setError(response.data.message || "Failed to fetch data");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    fetchClinics();
  }, [selectedRole]);

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
    setPage(1);
    setError("");
  };

  // Thay đổi trạng thái 
  const handleChangeStatus = async (recordId, currentStatus, userRole) => {
    const normalizedStatus = currentStatus?.toLowerCase();
    const newStatus = normalizedStatus === 'active' ? 'inactive' : 'active';

    if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this ${userRole}?`)) {
      return;
    }

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

        alert(`${userRole} status updated to ${newStatus} successfully!`);
        setError('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/clinic", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) {
        setClinics(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
    }
  };

  const handleCreateDoctor = async () => {
    // Kiểm tra dữ liệu đầu vào
    if (!formData.fullname.trim()) {
      showAlert("Please Enter Full Name");
      return;
    }

    if (!formData.email.trim()) {
      showAlert("Please Enter Email");
      return;
    }

    if (!formData.password.trim()) {
      showAlert("Please Enter Password");
      return;
    }

    if (!formData.clinic_id || !formData.clinic_id.trim()) {
      showAlert("Please Select Clinic");
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
        showAlert("Doctor Account Creation Successful!");
        await fetchData();
      }
    } catch (error) {
      console.error("Create doctor error:", error);

      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        const errorMsg = error.response.data?.error;

        if (errorMsg === "Email đã được đăng ký") {
          showAlert("This email has already been registered.");
        } else if (errorMsg === "Phòng này đã được sử dụng bởi bác sĩ khác") {
          showAlert("This clinic has already been used by another doctor.");
        } else {
          showAlert(`Error: ${errorMsg || "Failed to create account"}`);
        }
      } else {
        showAlert("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    // Kiểm tra dữ liệu đầu vào
    if (!staffFormData.fullname.trim()) {
      showAlert("Please Enter Full Name");
      return;
    }

    if (!staffFormData.email.trim()) {
      showAlert("Please Enter Email");
      return;
    }

    if (!staffFormData.password.trim()) {
      showAlert("Please Enter Password");
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
        showAlert("Staff Account Creation Successful!");
        await fetchData();
      }
    } catch (error) {
      console.error("Create staff error:", error);

      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        const errorMsg = error.response.data?.error;

        if (errorMsg === "Email đã được đăng ký") {
          showAlert("This email has already been registered.");
        } else {
          showAlert(`Error: ${errorMsg || "Failed to create staff account"}`);
        }
      } else {
        showAlert("Network error. Please check your connection and try again.");
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
        <h2 style={{ margin: 0 }}>User Account Management</h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <FormControl variant="outlined" size="small" style={{ width: "150px" }}>
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              value={selectedRole}
              onChange={handleRoleChange}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
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
              Add Doctor
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              style={{ whiteSpace: "nowrap", minWidth: "140px", textTransform: "none" }}
              onClick={() => setOpenStaffDialog(true)}
            >
              Add Staff
            </Button>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <Box sx={{ marginBottom: "16px" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, email, username, or role..."
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
        Total Users: {filteredData.length}
        {searchTerm && ` (filtered from ${data.length})`}
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
                  ID
                </TableCell>
                <TableCell sx={{ width: "120px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Username
                </TableCell>
                <TableCell sx={{ width: "150px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Full Name
                </TableCell>
                <TableCell sx={{ width: "200px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Email
                </TableCell>
                <TableCell sx={{ width: "80px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Role
                </TableCell>
                <TableCell sx={{ width: "120px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Phone
                </TableCell>
                <TableCell sx={{ width: "180px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Address
                </TableCell>
                <TableCell sx={{ width: "100px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Status
                </TableCell>
                <TableCell sx={{ width: "140px", whiteSpace: "nowrap", fontWeight: "bold" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                    {loading ? "Loading..." : searchTerm ? "No matching results found" : "No data found"}
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
                        {user.Status?.toLowerCase() || "N/A"}
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
                        {loading ? 'Updating...' : 'Change Status'}
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
              Showing {filteredData.length === 0 ? 0 : ((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, filteredData.length)} of {filteredData.length} entries
              {searchTerm && ` (filtered from ${data.length} total entries)`}
            </Typography>
          </Box>
        </TableContainer>
      </div>

      {/* Add Doctor Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Doctor</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Full Name"
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
            label="Password"
            margin="normal"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            autoComplete="off"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Clinic</InputLabel>
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
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateDoctor}
            variant="contained"
            color="primary"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={openStaffDialog} onClose={() => setOpenStaffDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Staff</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Full Name"
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
            label="Password"
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
            Cancel
          </Button>
          <Button
            onClick={handleCreateStaff}
            variant="contained"
            color="secondary"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AccountManagement;
