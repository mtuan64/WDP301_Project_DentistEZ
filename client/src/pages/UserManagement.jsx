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
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../assets/css/UserAccountManagement.css";

const UserAccountManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState(""); // State for role filter
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    console.log("Token:", token);
    console.log("User:", user);

    if (!token || !user || user.role !== "admin") {
      console.log("Redirecting due to missing token or non-admin role");
      navigate("/");
      return;
    }

    fetchUsers();
  }, [navigate, roleFilter]); // Re-fetch users when roleFilter changes

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = roleFilter
        ? "http://localhost:9999/api/users/role"
        : "http://localhost:9999/api/users-management";

      const params = { page: 1, limit: 10 };
      if (roleFilter) params.role = roleFilter;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        params,
      });

      console.log("API Response:", response.data);
      if (response.data.success && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else {
        console.error("Response data is not in expected format:", response.data);
        setUsers([]);
        setError("Response data is not in expected format");
      }
    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error.message);
      setUsers([]);
      setError(error.response?.data?.msg || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
  };

  const handleViewDetails = (userId) => {
    navigate(`/users/${userId}`); // Navigate to a user details page
  };

  return (
    <div className="user-account-management">
      <h1>User Account Management</h1>

      {/* Role Filter */}
      <div className="filters">
        <FormControl variant="outlined" size="small" style={{ width: "150px", marginBottom: "20px" }}>
          <InputLabel>Role</InputLabel>
          <Select
            label="Role"
            value={roleFilter}
            onChange={handleRoleFilterChange}
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="patient">Patient</MenuItem>
            <MenuItem value="doctor">Doctor</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* Error Message */}
      {error && (
        <Alert severity="error" style={{ marginBottom: "20px" }}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="loading">
          <CircularProgress />
        </div>
      )}

      {/* User Count */}
      {!loading && (
        <p>Tổng số người dùng: {users.length}</p>
      )}

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={7}>No users found</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username || "N/A"}</TableCell>
                  <TableCell>{user.fullname || "N/A"}</TableCell>
                  <TableCell>{user.email || "N/A"}</TableCell>
                  <TableCell>{user.role || "N/A"}</TableCell>
                  <TableCell>{user.phone || "N/A"}</TableCell>
                  <TableCell>{user.address || "N/A"}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleViewDetails(user._id)}
                      size="small"
                      style={{ whiteSpace: "nowrap", minWidth: "80px", textTransform: "none" }}
                    >
                      View Details
                    </Button>
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

export default UserAccountManagement;
