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
  Tab,
  Tabs,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../assets/css/UserListPage.css"; // Import custom CSS

const UserListPage = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [tabValue, setTabValue] = useState(0);
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
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const [patientRes, doctorRes, staffRes] = await Promise.all([
        axios.get("http://localhost:9999/api/patients", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }).catch(err => {
          console.error("Patient fetch error:", err.response?.data || err.message);
          return { data: { success: false, data: [] } };
        }),
        axios.get("http://localhost:9999/api/doctor", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }).catch(err => {
          console.error("Doctor fetch error:", err.response?.data || err.message);
          return { data: { success: false, data: [] } };
        }),
        axios.get("http://localhost:9999/api/staff", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }).catch(err => {
          console.error("Staff fetch error:", err.response?.data || err.message);
          return { data: { success: false, data: [] } };
        }),
      ]);

      console.log("Patient Response:", patientRes.data);
      console.log("Doctor Response:", doctorRes.data);
      console.log("Staff Response:", staffRes.data);

      setPatients(patientRes.data.success && Array.isArray(patientRes.data.data) ? patientRes.data.data : []);
      setDoctors(doctorRes.data.success && Array.isArray(doctorRes.data.data) ? doctorRes.data.data : []);
      setStaff(staffRes.data.success && Array.isArray(staffRes.data.data) ? staffRes.data.data : []);
    } catch (error) {
      console.error("Unexpected fetch error:", error);
      setPatients([]);
      setDoctors([]);
      setStaff([]);
    }
  };

  const handleChangeStatus = async (userId, currentStatus, userType) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const response = await axios.put(
        `http://localhost:9999/api/${userType}/${userId}/status`,
        { Status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        if (userType === "doctor") {
          setDoctors(doctors.map((d) => (d._id === userId ? { ...d, Status: response.data.data.Status } : d)));
        } else if (userType === "staff") {
          setStaff(staff.map((s) => (s._id === userId ? { ...s, Status: response.data.data.Status } : s)));
        }
      }
    } catch (error) {
      console.error(`Error updating ${userType} status:`, error.response?.data || error.message);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div className="user-list-page">
      <h1 className="page-title">Admin Dashboard - User Management</h1>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="user management tabs"
          sx={{
            "& .MuiTab-root": { fontSize: "14px", textTransform: "none", fontWeight: 500 },
            "& .Mui-selected": { color: "#06A3DA" },
            "& .MuiTabs-indicator": { backgroundColor: "#06A3DA" },
          }}
        >
          <Tab label="Patients" />
          <Tab label="Doctors" />
          <Tab label="Staff" />
        </Tabs>
      </Box>
      {tabValue === 0 && (
        <>
          <p className="total-count">Total patients: {patients.length}</p>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Date of Birth</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Profile Image</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No patients found</TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow key={patient._id}>
                      <TableCell>{patient.userId?.fullname || "N/A"}</TableCell>
                      <TableCell>{patient.userId?.email || "N/A"}</TableCell>
                      <TableCell>
                        {patient.userId?.dateOfBirth ? new Date(patient.userId.dateOfBirth).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>{patient.userId?.address || "N/A"}</TableCell>
                      <TableCell>{patient.userId?.phone || "N/A"}</TableCell>
                      <TableCell>{patient.userId?.gender || "N/A"}</TableCell>
                      <TableCell>
                        {patient.userId?.profilePicture ? (
                          <img
                            src={patient.userId.profilePicture}
                            alt="Profile"
                            className="profile-img"
                          />
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      {tabValue === 1 && (
        <>
          <p className="total-count">Total doctors: {doctors.length}</p>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Clinic ID</TableCell>
                  <TableCell>Specialty</TableCell>
                  <TableCell>Degree</TableCell>
                  <TableCell>Experience (Years)</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Profile Image</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>No doctors found</TableCell>
                  </TableRow>
                ) : (
                  doctors.map((doctor) => (
                    <TableRow key={doctor._id}>
                      <TableCell>{doctor.userId?.fullname || doctor.fullname || "N/A"}</TableCell>
                      <TableCell>{doctor.clinic_id || "N/A"}</TableCell>
                      <TableCell>{doctor.Specialty || "N/A"}</TableCell>
                      <TableCell>{doctor.Degree || "N/A"}</TableCell>
                      <TableCell>{doctor.ExperienceYears || "N/A"}</TableCell>
                      <TableCell>{doctor.Description || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color={doctor.Status === "active" ? "primary" : "secondary"}
                          onClick={() => handleChangeStatus(doctor._id, doctor.Status, "doctor")}
                          size="small"
                          className="action-btn doctor-status-btn"
                        >
                          {doctor.Status === "active" ? "Active" : "Inactive"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {doctor.ProfileImage ? (
                          <img
                            src={doctor.ProfileImage}
                            alt="Profile"
                            className="profile-img"
                          />
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      {tabValue === 2 && (
        <>
          <p className="total-count">Total staff: {staff.length}</p>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>No staff found</TableCell>
                  </TableRow>
                ) : (
                  staff.map((staffMember) => (
                    <TableRow key={staffMember._id}>
                      <TableCell>{staffMember.userId?.fullname || "N/A"}</TableCell>
                      <TableCell>{staffMember.userId?.email || "N/A"}</TableCell>
                      <TableCell>{staffMember.userId?.address || "N/A"}</TableCell>
                      <TableCell>{staffMember.userId?.phone || "N/A"}</TableCell>
                      <TableCell>{staffMember.userId?.gender || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color={staffMember.Status === "active" ? "primary" : "secondary"}
                          onClick={() => handleChangeStatus(staffMember._id, staffMember.Status, "staff")}
                          size="small"
                          className="action-btn"
                        >
                          {staffMember.Status === "active" ? "Active" : "Inactive"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </div>
  );
};

export default UserListPage;