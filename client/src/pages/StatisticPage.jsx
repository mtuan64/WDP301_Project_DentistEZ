import React, { useEffect, useState } from "react";
import { Line, Bar } from "@ant-design/plots";
import { Card, Col, Row, Typography, Table } from "antd";
import axios from "axios";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { debounce } from "lodash";
import {
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons"; // Import icons from Ant Design

const AppointmentStats = () => {
  const [appointmentData, setAppointmentData] = useState([]);
  const [appointmentStatusData, setAppointmentStatusData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [paymentTypeData, setPaymentTypeData] = useState([]);
  const [summaries, setSummaries] = useState({
    totalAppointments: 0,
    totalRevenue: 0,
    completedAppointments: 0,
    fullyPaidAppointments: 0,
  });
  const [loading, setLoading] = useState({
    appointmentTrend: false,
    appointmentStatus: false,
    revenueTrend: false,
    paymentType: false,
    summaries: false,
  });
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(29, "day"),
    dayjs(),
  ]);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const { RangePicker } = DatePicker;

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const fetchStats = debounce(async (startDate, endDate) => {
    setLoading({
      appointmentTrend: true,
      appointmentStatus: true,
      revenueTrend: true,
      paymentType: true,
      summaries: true,
    });

    const query = `?start=${startDate}&end=${endDate}`;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [
        appointmentRes,
        statusRes,
        revenueRes,
        paymentTypeRes,
        summaryRes,
      ] = await Promise.all([
        axios
          .get(`http://localhost:9999/api/appointment-trend${query}`, { headers })
          .catch(err => { throw new Error(`Appointment Trend: ${err.message}`); }),
        axios
          .get(`http://localhost:9999/api/appointment-status-stats${query}`, { headers })
          .catch(err => { throw new Error(`Status Stats: ${err.message}`); }),
        axios
          .get(`http://localhost:9999/api/revenue-trend${query}`, { headers })
          .catch(err => { throw new Error(`Revenue Trend: ${err.message}`); }),
        axios
          .get(`http://localhost:9999/api/revenue-by-type${query}`, { headers })
          .catch(err => { throw new Error(`Payment Type: ${err.message}`); }),
        axios
          .get(`http://localhost:9999/api/summaries${query}`, { headers })
          .catch(err => { throw new Error(`Summaries: ${err.message}`); }),
      ]);

      // Log responses for debugging
      console.log("API Responses:", {
        appointment: appointmentRes.data,
        status: statusRes.data,
        revenue: revenueRes.data,
        paymentType: paymentTypeRes.data,
        summaries: summaryRes.data,
      });

      // Validate and map data
      setAppointmentData(
        Array.isArray(appointmentRes.data.data || appointmentRes.data)
          ? (appointmentRes.data.data || appointmentRes.data)
              .filter(item => item._id && typeof item.count === "number")
              .map(item => ({ date: item._id, count: item.count }))
          : []
      );
      setAppointmentStatusData(
        Array.isArray(statusRes.data.data || statusRes.data)
          ? (statusRes.data.data || statusRes.data)
              .filter(item => item._id && typeof item.count === "number")
              .map(item => ({ status: item._id, count: item.count }))
          : []
      );
      setRevenueData(
        Array.isArray(revenueRes.data.data || revenueRes.data)
          ? (revenueRes.data.data || revenueRes.data)
              .filter(item => item._id && typeof item.totalRevenue === "number")
              .map(item => ({ date: item._id, revenue: item.totalRevenue }))
          : []
      );
      setPaymentTypeData(
        Array.isArray(paymentTypeRes.data.data || paymentTypeRes.data)
          ? (paymentTypeRes.data.data || paymentTypeRes.data)
              .filter(item => item._id && typeof item.total === "number")
              .map(item => ({ type: item._id, total: item.total }))
          : []
      );
      setSummaries(
        (summaryRes.data.data || summaryRes.data) && typeof (summaryRes.data.data || summaryRes.data) === "object"
          ? {
              totalAppointments: (summaryRes.data.data || summaryRes.data).totalAppointments || 0,
              totalRevenue: (summaryRes.data.data || summaryRes.data).totalRevenue || 0,
              completedAppointments: (summaryRes.data.data || summaryRes.data).completedAppointments || 0,
              fullyPaidAppointments: (summaryRes.data.data || summaryRes.data).fullyPaidAppointments || 0,
            }
          : { totalAppointments: 0, totalRevenue: 0, completedAppointments: 0, fullyPaidAppointments: 0 }
      );
    } catch (error) {
      console.error("Fetch error:", error);
      setToast({ show: true, message: "Không thể tải dữ liệu dashboard!", type: "error" });
      // Reset data on error
      setAppointmentData([]);
      setAppointmentStatusData([]);
      setRevenueData([]);
      setPaymentTypeData([]);
      setSummaries({ totalAppointments: 0, totalRevenue: 0, completedAppointments: 0, fullyPaidAppointments: 0 });
    } finally {
      setLoading({
        appointmentTrend: false,
        appointmentStatus: false,
        revenueTrend: false,
        paymentType: false,
        summaries: false,
      });
    }
  }, 500);

  useEffect(() => {
    const [start, end] = dateRange;
    fetchStats(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
  }, [dateRange]);

  // Dynamic color mapping for appointment status
  const statusColorMap = {
    completed: "#52c41a",
    pending: "#1890ff",
    cancelled: "#ff4d4f",
    scheduled: "#faad14",
  };

  // Chart configurations
  const appointmentLineConfig = {
    data: appointmentData,
    xField: "date",
    yField: "count",
    height: 250,
    smooth: true,
    point: { size: 4, shape: "circle" },
    color: "#1890ff",
  };

  const appointmentBarConfig = {
    data: appointmentData,
    xField: "date",
    yField: "count",
    height: 250,
    columnWidthRatio: 0.5,
    color: "#3498db",
    label: false,
  };

  const revenueLineConfig = {
    data: revenueData,
    xField: "date",
    yField: "revenue",
    height: 250,
    smooth: true,
    point: { size: 4, shape: "circle" },
    color: "#52c41a",
  };

  const appointmentStatusConfig = {
    data: appointmentStatusData,
    xField: "status",
    yField: "count",
    height: 250,
    columnWidthRatio: 0.6,
    colorField: "status",
    color: (datum) => statusColorMap[datum.status] || "#1890ff",
    label: false,
  };

  const paymentTypeConfig = {
    data: paymentTypeData,
    xField: "type",
    yField: "total",
    height: 250,
    columnWidthRatio: 0.6,
    colorField: "type",
    color: ["#1890ff", "#52c41a"],
    label: false,
  };

  // Table columns
  const appointmentColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return isNaN(dateA) || isNaN(dateB) ? 0 : dateA - dateB;
      },
    },
    {
      title: "Number of Appointments",
      dataIndex: "count",
      key: "count",
      sorter: (a, b) => a.count - b.count,
    },
  ];

  const revenueColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return isNaN(dateA) || isNaN(dateB) ? 0 : dateA - dateB;
      },
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      sorter: (a, b) => a.revenue - b.revenue,
      render: (value) => `${value.toLocaleString()} VND`,
    },
  ];

  const appointmentStatusColumns = [
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "Number of Appointments",
      dataIndex: "count",
      key: "count",
      sorter: (a, b) => a.count - b.count,
    },
  ];

  const paymentTypeColumns = [
    {
      title: "Payment Type",
      dataIndex: "type",
      key: "type",
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: "Total Revenue",
      dataIndex: "total",
      key: "total",
      sorter: (a, b) => a.total - b.total,
      render: (value) => `${value.toLocaleString()} VND`,
    },
  ];

  // Styling inspired by ServiceManagement
  const containerStyle = {
    maxWidth: 1200,
    margin: "40px auto",
    padding: 32,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
  };

  const tableWrapperStyle = {
    overflowX: "auto",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    padding: 24,
    marginBottom: 32,
  };

  return (
    <div style={containerStyle}>
      {/* Toast notification */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: 30,
            right: 30,
            zIndex: 9999,
            padding: "16px 28px",
            borderRadius: 8,
            background: toast.type === "success" ? "#4caf50" : "#f44336",
            color: "#fff",
            fontWeight: 600,
            fontSize: 18,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}

      <Typography.Title level={2} style={{ marginBottom: 24, fontWeight: 700 }}>
        <BarChartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
        Dashboard Statistics ({dateRange[0].format("YYYY-MM-DD")} to {dateRange[1].format("YYYY-MM-DD")})
      </Typography.Title>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "center" }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (!dates) return;
            setDateRange(dates);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            minWidth: 340,
            maxWidth: 480,
          }}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            title={
              <span>
                <CalendarOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                Total Appointments
              </span>
            }
            loading={loading.summaries}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {summaries.totalAppointments.toLocaleString()}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            title={
              <span>
                <DollarOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                Total Revenue
              </span>
            }
            loading={loading.summaries}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {summaries.totalRevenue.toLocaleString()} VND
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            title={
              <span>
                <CheckCircleOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                Completed Examinations
              </span>
            }
            loading={loading.summaries}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {summaries.completedAppointments.toLocaleString()}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            title={
              <span>
                <CreditCardOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                Fully Paid Appointments
              </span>
            }
            loading={loading.summaries}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {summaries.fullyPaidAppointments.toLocaleString()}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <LineChartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                Appointments Over Time
              </span>
            }
            loading={loading.appointmentTrend}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {appointmentData.length > 0 ? (
              <Line {...appointmentLineConfig} />
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                Không có dữ liệu cho khoảng thời gian này
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <BarChartOutlined style={{ marginRight: 8, color: "#3498db" }} />
                Appointments per Day
              </span>
            }
            loading={loading.appointmentTrend}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {appointmentData.length > 0 ? (
              <Bar {...appointmentBarConfig} />
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                Không có dữ liệu cho khoảng thời gian này
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <LineChartOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                Revenue Over Time
              </span>
            }
            loading={loading.revenueTrend}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {revenueData.length > 0 ? (
              <Line {...revenueLineConfig} />
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                Không có dữ liệu cho khoảng thời gian này
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <PieChartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                Appointment Status Distribution
              </span>
            }
            loading={loading.appointmentStatus}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {appointmentStatusData.length > 0 ? (
              <Bar {...appointmentStatusConfig} />
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                Không có dữ liệu cho khoảng thời gian này
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <div style={tableWrapperStyle}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              title={
                <span>
                  <CalendarOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                  Appointments by Date
                </span>
              }
              loading={loading.appointmentTrend}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
            >
              <Table
                columns={appointmentColumns}
                dataSource={appointmentData}
                rowKey="date"
                pagination={false}
                bordered
                locale={{ emptyText: "Không có dữ liệu cho khoảng thời gian này" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title={
                <span>
                  <DollarOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                  Revenue by Date
                </span>
              }
              loading={loading.revenueTrend}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
            >
              <Table
                columns={revenueColumns}
                dataSource={revenueData}
                rowKey="date"
                pagination={false}
                bordered
                locale={{ emptyText: "Không có dữ liệu cho khoảng thời gian này" }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AppointmentStats;