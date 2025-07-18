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
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const PaymentManage = () => {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
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
        setPayments(res.data.data.payments);
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
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Payment Management</h1>

      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
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
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="canceled">Canceled</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" style={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
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
            onChange={(e) => setMethodFilter(e.target.value)}
            label="Method"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <p className="total-count mb-4">Total payments: {filteredPayments.length}</p>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow style={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>STT</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Clinic</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No payments found</TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment, index) => (
                <TableRow key={payment._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{payment.metaData?.patient || "N/A"}</TableCell>
                  <TableCell>{payment.metaData?.doctor || "N/A"}</TableCell>
                  <TableCell>{payment.metaData?.service || "N/A"}</TableCell>
                  <TableCell>{payment.metaData?.clinic || "N/A"}</TableCell>
                  <TableCell>{payment.amount} đ</TableCell>
                  <TableCell>
                    <Chip label={payment.status.toUpperCase()} color={getStatusColor(payment.status)} />
                  </TableCell>
                  <TableCell>{payment.type}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell>
                    {payment.createdAt
                      ? dayjs(payment.createdAt).format("DD/MM/YYYY HH:mm")
                      : "N/A"}
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

export default PaymentManage;
