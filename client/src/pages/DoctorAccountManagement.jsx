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
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../assets/css/DoctorAccountManagement.css";

const DoctorAccountManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editForm, setEditForm] = useState({
    Specialty: "",
    Degree: "",
    ExperienceYears: "",
    Description: "",
    ProfileImage: "",
  });
  const doctorsPerPage = 3;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/");
      return;
    }

    if (!token || !user || user.role !== "admin") {
      console.log("Redirecting due to missing token or non-admin role");
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchDoctors(token), fetchClinics(token)]);
      } catch (err) {
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const fetchDoctors = async (token) => {
    try {
      const response = await axios.get("http://localhost:9999/api/doctor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const doctorData = Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];
      setDoctors(doctorData);
    } catch (error) {
      console.error("Error fetching doctors:", error.response?.data || error.message);
      setDoctors([]);
      throw error;
    }
  };

  const fetchClinics = async (token) => {
    try {
      const response = await axios.get("http://localhost:9999/api/clinic", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClinics(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      setClinics([]);
      throw error;
    }
  };

  const handleChangeStatus = async (doctorId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const response = await axios.put(
        `http://localhost:9999/api/doctor/${doctorId}/status`,
        { Status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.data.success && response.data.data?.Status) {
        setDoctors(
          doctors.map((doctor) =>
            doctor._id === doctorId ? { ...doctor, Status: response.data.data.Status } : doctor
          )
        );
        setMessage(`Doctor status updated to ${newStatus}`);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage("Failed to update doctor status.");
      }
    } catch (error) {
      console.error("Error updating doctor status:", error.response?.data || error.message);
      setMessage("Failed to update doctor status. Please try again.");
    }
  };

  const handleOpenEditDialog = (doctor) => {
    setSelectedDoctor(doctor);
    setEditForm({
      Specialty: doctor.Specialty || "",
      Degree: doctor.Degree || "",
      ExperienceYears: doctor.ExperienceYears || "",
      Description: doctor.Description || "",
      ProfileImage: doctor.ProfileImage || "",
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedDoctor(null);
    setEditForm({
      Specialty: "",
      Degree: "",
      ExperienceYears: "",
      Description: "",
      ProfileImage: "",
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditDoctor = async () => {
    if (!selectedDoctor) return;

    try {
      const response = await axios.put(
        `http://localhost:9999/api/doctors/${selectedDoctor._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (response.data.success) {
        setDoctors(
          doctors.map((doctor) =>
            doctor._id === selectedDoctor._id ? { ...doctor, ...response.data.data } : doctor
          )
        );
        setMessage("Doctor updated successfully");
        setTimeout(() => setMessage(null), 3000);
        handleCloseEditDialog();
      } else {
        setMessage("Failed to update doctor.");
      }
    } catch (error) {
      console.error("Error updating doctor:", error.response?.data || error.message);
      setMessage("Failed to update doctor. Please try again.");
    }
  };

  const truncateDescription = (description) => {
    if (!description) return "N/A";
    return description.length > 30 ? `${description.slice(0, 30)}...` : description;
  };

  const filteredDoctors = selectedClinic
    ? doctors.filter((doctor) => doctor.clinic_id?._id === selectedClinic)
    : doctors;

  const paginatedDoctors = filteredDoctors.slice(
    (page - 1) * doctorsPerPage,
    page * doctorsPerPage
  );

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <div className="doctor-account-management">
      <h1>Doctor Account Management</h1>
      <p>Total Doctors: {filteredDoctors.length}</p>
      {loading && <p>Loading...</p>}
      {error && <p className="message error">{error}</p>}
      {message && (
        <p className={`message ${message.includes("Failed") ? "error" : "success"}`}>
          {message}
        </p>
      )}
      <FormControl fullWidth style={{ marginBottom: "20px", maxWidth: "300px" }}>
        <InputLabel>Filter by Clinic</InputLabel>
        <Select
          value={selectedClinic}
          onChange={(e) => {
            setSelectedClinic(e.target.value);
            setPage(1);
          }}
          label="Filter by Clinic"
        >
          <MenuItem value="">All Clinics</MenuItem>
          {clinics.map((clinic) => (
            <MenuItem key={clinic._id} value={clinic._id}>
              {clinic.clinic_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Full Name</TableCell>
              <TableCell>Clinic Name</TableCell>
              <TableCell>Specialty</TableCell>
              <TableCell>Degree</TableCell>
              <TableCell>Experience (Years)</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Profile Image</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>Loading...</TableCell>
              </TableRow>
            ) : paginatedDoctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No doctors found</TableCell>
              </TableRow>
            ) : (
              paginatedDoctors.map((doctor) => (
                <TableRow key={doctor._id}>
                  <TableCell>{doctor.userId?.fullname || "N/A"}</TableCell>
                  <TableCell>{doctor.clinic_id?.clinic_name || "N/A"}</TableCell>
                  <TableCell>{doctor.Specialty || "N/A"}</TableCell>
                  <TableCell>{doctor.Degree || "N/A"}</TableCell>
                  <TableCell>{doctor.ExperienceYears || "N/A"}</TableCell>
                  <TableCell>{truncateDescription(doctor.Description)}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color={doctor.Status === "active" ? "primary" : "secondary"}
                      onClick={() => handleChangeStatus(doctor._id, doctor.Status)}
                      size="small"
                      className="status-button"
                      aria-label={`Set doctor status to ${doctor.Status === "active" ? "inactive" : "active"}`}
                    >
                      {doctor.Status === "active" ? "Active" : "Inactive"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {doctor.ProfileImage ? (
                      <img
                        src={doctor.ProfileImage}
                        alt="Profile"
                        className="profile-image"
                      />
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleOpenEditDialog(doctor)}
                      size="small"
                      aria-label={`Edit doctor ${doctor.userId?.fullname || "N/A"}`}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination
        count={Math.ceil(filteredDoctors.length / doctorsPerPage)}
        page={page}
        onChange={handlePageChange}
        sx={{ mt: 2, display: "flex", justifyContent: "center" }}
      />
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Doctor</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="Specialty"
            label="Specialty"
            type="text"
            fullWidth
            value={editForm.Specialty}
            onChange={handleEditFormChange}
            required
          />
          <TextField
            margin="dense"
            name="Degree"
            label="Degree"
            type="text"
            fullWidth
            value={editForm.Degree}
            onChange={handleEditFormChange}
            required
          />
          <TextField
            margin="dense"
            name="ExperienceYears"
            label="Experience Years"
            type="number"
            fullWidth
            value={editForm.ExperienceYears}
            onChange={handleEditFormChange}
            required
            inputProps={{ min: 0 }}
          />
          <TextField
            margin="dense"
            name="Description"
            label="Description"
            type="text"
            fullWidth
            value={editForm.Description}
            onChange={handleEditFormChange}
            multiline
            rows={4}
          />
          <TextField
            margin="dense"
            name="ProfileImage"
            label="Profile Image URL"
            type="text"
            fullWidth
            value={editForm.ProfileImage}
            onChange={handleEditFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleEditDoctor} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DoctorAccountManagement;