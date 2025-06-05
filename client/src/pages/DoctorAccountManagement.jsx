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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../assets/css/DoctorAccountManagement.css";

const DoctorAccountManagement = () => {
  const [doctors, setDoctors] = useState([]);
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

    fetchDoctors();
  }, [navigate]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/doctor", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("API Response:", response.data);
      if (response.data.success && Array.isArray(response.data.data)) {
        setDoctors(response.data.data);
      } else {
        console.error("Response data is not in expected format:", response.data);
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error.response?.data || error.message);
      setDoctors([]);
    }
  };

  const handleChangeStatus = async (doctorId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const response = await axios.put(
        `http://localhost:9999/api/doctor/${doctorId}/status`,
        { Status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setDoctors(
          doctors.map((doctor) =>
            doctor._id === doctorId ? { ...doctor, Status: response.data.data.Status } : doctor
          )
        );
      } else {
        console.error("Failed to update status:", response.data.message);
      }
    } catch (error) {
      console.error("Error updating doctor status:", error.response?.data || error.message);
    }
  };

  return (
    <div className="doctor-account-management">
      <h1>Doctor Account Management</h1>
      <p>Tổng số bác sĩ: {doctors.length}</p> {/* Debug: Kiểm tra số lượng bác sĩ */}
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
                  <TableCell>{doctor.userId?.fullname || "N/A"}</TableCell>
                  <TableCell>{doctor.clinic_id}</TableCell>
                  <TableCell>{doctor.Specialty || "N/A"}</TableCell>
                  <TableCell>{doctor.Degree || "N/A"}</TableCell>
                  <TableCell>{doctor.ExperienceYears || "N/A"}</TableCell>
                  <TableCell>{doctor.Description || "N/A"}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color={doctor.Status === "active" ? "primary" : "secondary"}
                      onClick={() => handleChangeStatus(doctor._id, doctor.Status)}
                      size="small"
                      style={{ whiteSpace: "nowrap", minWidth: "80px", textTransform: "none" }}
                    >
                      {doctor.Status === "active" ? "Active" : "Inactive"}
                    </Button>
                  </TableCell>

                  <TableCell>
                    {doctor.ProfileImage ? (
                      <img
                        src={doctor.ProfileImage}
                        alt="Profile"
                        style={{ width: "50px", height: "50px", objectFit: "cover" }}
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
    </div>
  );
};

export default DoctorAccountManagement;