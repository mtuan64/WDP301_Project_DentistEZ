import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Box,
  Button,
  Select,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../assets/css/StatisticPage.css";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StaticPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [monthFilter, setMonthFilter] = useState("");
  const [weekFilter, setWeekFilter] = useState("Week 1");
  const navigate = useNavigate();

  // Hardcoded appointment data
  const appointments = [
    {
      _id: "1",
      name: "Courtney Henry",
      email: "courtney@gmail.com",
      dateTime: "24 May at 10:00 AM",
      reason: "Acne Treatment",
      type: "New Patient",
    },
    {
      _id: "2",
      name: "Jerome Bell",
      email: "jerome@gmail.com",
      dateTime: "28 May at 12:00 PM",
      reason: "Tooth Cleaning",
      type: "New Patient",
    },
    {
      _id: "3",
      name: "Darrell Steward",
      email: "darrell@gmail.com",
      dateTime: "30 May at 04:00 PM",
      reason: "Skin Whitening",
      type: "Old Patient",
    },
    {
      _id: "4",
      name: "Esther Howard",
      email: "esther@gmail.com",
      dateTime: "06 June at 10:00 AM",
      reason: "Eye Checkup",
      type: "Old Patient",
    },
    {
      _id: "5",
      name: "Floyd Miles",
      email: "floyd@gmail.com",
      dateTime: "06 June at 11:00 AM",
      reason: "Regular",
      type: "Old Patient",
    },
    {
      _id: "6",
      name: "Guy Hawkins",
      email: "guy@gmail.com",
      dateTime: "08 June at 10:30 AM",
      reason: "Fever",
      type: "New Patient",
    },
    {
      _id: "7",
      name: "Amine Steward",
      email: "amine@gmail.com",
      dateTime: "12 June at 01:00 PM",
      reason: "Malaria",
      type: "Old Patient",
    },
  ];

  // Combined financial data (Revenue + Payments)
  const financialData = [
    ...[
      {
        _id: "r1",
        customerName: "John Doe",
        dateTime: "2025-06-01",
        paymentMethod: "N/A",
        amount: 150.0,
        paymentStatus: "Paid",
        service: "General Checkup",
      },
      {
        _id: "r2",
        customerName: "Jane Roe",
        dateTime: "2025-06-02",
        paymentMethod: "N/A",
        amount: 200.0,
        paymentStatus: "Pending",
        service: "Dental Cleaning",
      },
      {
        _id: "r3",
        customerName: "Alice Johnson",
        dateTime: "2025-06-03",
        paymentMethod: "N/A",
        amount: 120.0,
        paymentStatus: "Paid",
        service: "Eye Exam",
      },
    ],
    ...[
      {
        _id: "p1",
        customerName: "Isabella Brown",
        dateTime: "24 May at 10:00 AM",
        paymentMethod: "Cash",
        amount: 50.0,
        paymentStatus: "Completed",
        service: "N/A",
      },
      {
        _id: "p2",
        customerName: "Daniel White",
        dateTime: "7 July at 03:15 PM",
        paymentMethod: "Online",
        amount: 41.0,
        paymentStatus: "Completed",
        service: "N/A",
      },
      {
        _id: "p3",
        customerName: "Ashley Garcia",
        dateTime: "23 July at 11:00 AM",
        paymentMethod: "Online",
        amount: 15.0,
        paymentStatus: "Completed",
        service: "N/A",
      },
      {
        _id: "p4",
        customerName: "Jonathan Thomas",
        dateTime: "13 Aug at 04:30 PM",
        paymentMethod: "Online",
        amount: 39.0,
        paymentStatus: "Completed",
        service: "N/A",
      },
      {
        _id: "p5",
        customerName: "Sophia Wilson",
        dateTime: "24 Aug at 06:45 PM",
        paymentMethod: "Cash",
        amount: 23.0,
        paymentStatus: "Completed",
        service: "N/A",
      },
      {
        _id: "p6",
        customerName: "Benjamin Chen",
        dateTime: "09 Sep at 01:00 PM",
        paymentMethod: "Cash",
        amount: 22.0,
        paymentStatus: "Completed",
        service: "N/A",
      },
      {
        _id: "p7",
        customerName: "Samantha Davis",
        dateTime: "23 Sep at 03:30 PM",
        paymentMethod: "Online",
        amount: 37.0,
        paymentStatus: "Completed",
        service: "N/A",
      },
    ],
  ];

  // Hardcoded upcoming appointments
  const upcomingAppointments = [
    {
      id: "1",
      dateTime: "21 June 2025 11:00 AM",
      service: "Skin Treatment",
      doctor: "Dr. Amine Louis",
    },
    {
      id: "2",
      dateTime: "21 June 2025 01:30 PM",
      service: "Cardiologist",
      doctor: "Dr. Keino Shine",
    },
    {
      id: "3",
      dateTime: "21 June 2025 04:00 PM",
      service: "Dentist",
      doctor: "Dr. Olivia Wilson",
    },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredFinancials = monthFilter
    ? financialData.filter((item) => {
        const date = item.dateTime.includes("at") ? item.dateTime.split(" at ")[0] : item.dateTime;
        const month = new Date(date).getMonth() + 1;
        return month === parseInt(monthFilter);
      })
    : financialData;

  const totalRevenue = filteredFinancials.reduce((sum, item) => sum + item.amount, 0).toFixed(2);

  // Dynamic chart data based on week
  const getChartData = () => {
    const baseData = {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Walking",
          borderColor: "rgba(0, 123, 255, 1)",
          backgroundColor: "rgba(0, 123, 255, 0.2)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Exercise",
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    };

    if (weekFilter === "Week 1") {
      baseData.datasets[0].data = [5, 9, 7, 6, 4, 3, 2]; // June 16-22, 2025
      baseData.datasets[1].data = [3, 5, 4, 6, 7, 8, 4];
    } else if (weekFilter === "Week 2") {
      baseData.datasets[0].data = [4, 6, 8, 5, 3, 2, 1]; // June 23-29, 2025
      baseData.datasets[1].data = [2, 4, 6, 7, 5, 3, 2];
    }

    return baseData;
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "Activity Status (Hours)", font: { size: 16 } },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: { stepSize: 1 },
      },
    },
  };

  return (
    <div className="static-dashboard">
      <h1 className="page-title">Admin Dashboard - Statistics</h1>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="statistics tabs"
          sx={{
            "& .MuiTab-root": { fontSize: "14px", textTransform: "none", fontWeight: 500 },
            "& .Mui-selected": { color: "#06A3DA" },
            "& .MuiTabs-indicator": { backgroundColor: "#06A3DA" },
          }}
        >
          <Tab label="Appointments" />
          <Tab label="Financials" />
          <Tab label="Activity Status" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <div className="appointment-header">
            <div>
              <h2>Appointments</h2>
              <p className="total-count">6 appointments today</p>
            </div>
            <div>
              <Button variant="contained" color="primary" style={{ marginRight: "10px" }}>
                Add Appointment +
              </Button>
              <Button variant="contained" color="primary" style={{ marginRight: "10px" }}>
                Upcoming
              </Button>
              <Button variant="contained" color="primary">
                Request
              </Button>
            </div>
          </div>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow
                  style={{
                    backgroundColor: "#f5f5f5", // Changed from #000 to light gray
                  }}
                >
                  <TableCell>No.</TableCell>
                  <TableCell>Names</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Date And Time</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No appointments found</TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appointment, index) => (
                    <TableRow key={appointment._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              backgroundColor: "#ccc",
                              marginRight: "8px",
                            }}
                          />
                          {appointment.name}
                        </div>
                      </TableCell>
                      <TableCell>{appointment.email}</TableCell>
                      <TableCell>{appointment.dateTime}</TableCell>
                      <TableCell>{appointment.reason}</TableCell>
                      <TableCell>{appointment.type}</TableCell>
                      <TableCell>
                        <EditIcon style={{ color: "green", cursor: "pointer", marginRight: "8px" }} />
                        <DeleteIcon style={{ color: "red", cursor: "pointer" }} />
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
          <div className="payment-header">
            <div>
              <h2>All Payments</h2>
              <p className="total-count">More Than 400+ Payment</p>
              <p className="total-count">Total Revenue: ${totalRevenue}</p>
            </div>
            <div>
              <Select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                displayEmpty
                style={{ marginRight: "10px", minWidth: "120px" }}
              >
                <MenuItem value="">Month</MenuItem>
                <MenuItem value="5">May</MenuItem>
                <MenuItem value="6">June</MenuItem>
                <MenuItem value="7">July</MenuItem>
                <MenuItem value="8">August</MenuItem>
                <MenuItem value="9">September</MenuItem>
              </Select>
            </div>
          </div>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow
                  style={{
                    backgroundColor: "#f5f5f5", // Changed from #000 to light gray
                  }}
                >
                  <TableCell>Sr. No.</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFinancials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>No financial data found</TableCell>
                  </TableRow>
                ) : (
                  filteredFinancials.map((item, index) => (
                    <TableRow key={item._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{item.dateTime}</TableCell>
                      <TableCell>{item.paymentMethod}</TableCell>
                      <TableCell>${item.amount.toFixed(2)}</TableCell>
                      <TableCell>{item.paymentStatus}</TableCell>
                      <TableCell>{item.service || "N/A"}</TableCell>
                      <TableCell>
                        <EditIcon style={{ color: "green", cursor: "pointer", marginRight: "8px" }} />
                        <DeleteIcon style={{ color: "red", cursor: "pointer" }} />
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
        <div className="activity-dashboard">
          <div className="activity-section">
            <h2>Activity Status</h2>
            <Select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              displayEmpty
              style={{ marginBottom: "20px", minWidth: "120px" }}
            >
              <MenuItem value="Week 1">Week 1</MenuItem>
              <MenuItem value="Week 2">Week 2</MenuItem>
            </Select>
            <Line data={getChartData()} options={chartOptions} />
          </div>
          <div className="upcoming-section">
            <h2>Upcoming Appointment</h2>
            <Select value="June" disabled style={{ marginBottom: "20px", minWidth: "120px" }}>
              <MenuItem value="June">June</MenuItem>
            </Select>
            <Select value="2025" disabled style={{ marginBottom: "20px", minWidth: "80px", marginLeft: "10px" }}>
              <MenuItem value="2025">2025</MenuItem>
            </Select>
            <div className="calendar">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
              {Array.from({ length: 42 }, (_, i) => {
                const date = i - new Date(2025, 5, 1).getDay() + 1; // June 1, 2025 is a Sunday
                const isToday = date === 21 && new Date().toLocaleDateString() === "6/21/2025";
                return (
                  <div
                    key={i}
                    className={`calendar-day ${isToday ? "today" : ""}`}
                  >
                    {date > 0 && date <= 30 ? date : ""}
                  </div>
                );
              })}
            </div>
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-icon">
                  {appointment.service === "Skin Treatment" && <span role="img" aria-label="skin">👤</span>}
                  {appointment.service === "Cardiologist" && <span role="img" aria-label="heart">❤️</span>}
                  {appointment.service === "Dentist" && <span role="img" aria-label="tooth">🦷</span>}
                </div>
                <div>
                  <div>{appointment.service}</div>
                  <div>{new Date(appointment.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •</div>
                  <div>{appointment.doctor}</div>
                </div>
                <div style={{ cursor: "pointer" }}></div>
              </div>
            ))}
            <div className="today-marker">Today 04:18 PM</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaticPage;