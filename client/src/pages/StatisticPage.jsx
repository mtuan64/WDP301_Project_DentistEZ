import React, { useEffect, useState } from "react";
import { Line, Bar } from "@ant-design/plots";
import { Card, Col, Row, Typography, Table, Select, Space, Button } from "antd";
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
} from "@ant-design/icons";

const { Option } = Select;

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
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [pageSizes, setPageSizes] = useState({
    appointment: 10,
    revenue: 10,
    status: 10,
    paymentType: 10,
  });
  const [currentPages, setCurrentPages] = useState({
    appointment: 1,
    revenue: 1,
    status: 1,
    paymentType: 1,
  });
  const { RangePicker } = DatePicker;

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const fetchStats = debounce(async (startDate, endDate) => {
    if (!startDate || !endDate || dayjs(startDate).isAfter(dayjs(endDate))) {
      setToast({ show: true, message: "Khoảng thời gian không hợp lệ!", type: "error" });
      return;
    }

    setLoading({
      appointmentTrend: true,
      appointmentStatus: true,
      revenueTrend: true,
      paymentType: true,
      summaries: true,
    });

    const query = `?start=${startDate}&end=${endDate}`;
    const token = localStorage.getItem("token");
    if (!token) {
      setToast({ show: true, message: "Không tìm thấy token xác thực!", type: "error" });
      return;
    }
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

      setAppointmentData(
        Array.isArray(appointmentRes.data.data || appointmentRes.data)
          ? (appointmentRes.data.data || appointmentRes.data)
              .filter(item => item._id && typeof item.count === "number")
              .map(item => ({ date: item._id, count: item.count }))
              .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort from oldest to newest
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
              .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort from oldest to newest
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
      setToast({ show: true, message: "Không thể tải dữ liệu thống kê!", type: "error" });
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

  const handleQuickRange = (days) => {
    const end = dayjs();
    const start = dayjs().subtract(days - 1, "day");
    setDateRange([start, end]);
    setCurrentPages({ appointment: 1, revenue: 1, status: 1, paymentType: 1 });
  };

  const statusColorMap = {
    completed: "#52c41a",
    pending: "#1890ff",
    cancelled: "#ff4d4f",
    scheduled: "#faad14",
  };

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

  const appointmentColumns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(b.date) - new Date(a.date),
      render: (value) => dayjs(value).format("YYYY-MM-DD"),
    },
    {
      title: "Số lượng cuộc hẹn",
      dataIndex: "count",
      key: "count",
      sorter: (a, b) => a.count - b.count,
    },
  ];

  const revenueColumns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(b.date) - new Date(a.date),
      render: (value) => dayjs(value).format("YYYY-MM-DD"),
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      sorter: (a, b) => a.revenue - b.revenue,
      render: (value) => `${value.toLocaleString()} VND`,
    },
  ];

  const appointmentStatusColumns = [
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "Số lượng cuộc hẹn",
      dataIndex: "count",
      key: "count",
      sorter: (a, b) => a.count - b.count,
    },
  ];

  const paymentTypeColumns = [
    {
      title: "Loại thanh toán",
      dataIndex: "type",
      key: "type",
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: "Tổng doanh thu",
      dataIndex: "total",
      key: "total",
      sorter: (a, b) => a.total - b.total,
      render: (value) => `${value.toLocaleString()} VND`,
    },
  ];

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

  const paginationStyle = {
    marginTop: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const customPagination = (data, type) => ({
    current: currentPages[type],
    pageSize: pageSizes[type],
    total: data.length,
    showSizeChanger: false,
    itemRender: (current, typeItem, originalElement) => {
      if (typeItem === "prev") {
        return <a style={{ color: "#00bcd4", fontWeight: "bold" }}>Previous</a>;
      }
      if (typeItem === "next") {
        return <a style={{ color: "#00bcd4", fontWeight: "bold" }}>Next</a>;
      }
      return originalElement;
    },
    onChange: (page) => {
      setCurrentPages((prev) => ({ ...prev, [type]: page }));
    },
  });

  return (
    <div style={containerStyle}>
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
        Bảng thống kê phân tích ({dateRange[0].format("YYYY-MM-DD")} to {dateRange[1].format("YYYY-MM-DD")})
      </Typography.Title>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        <Space>
          <Button
            onClick={() => handleQuickRange(7)}
            type={dateRange[1].diff(dateRange[0], "day") === 6 ? "primary" : "default"}
          >
            7 ngày
          </Button>
          <Button
            onClick={() => handleQuickRange(10)}
            type={dateRange[1].diff(dateRange[0], "day") === 9 ? "primary" : "default"}
          >
            10 ngày
          </Button>
          <Button
            onClick={() => handleQuickRange(15)}
            type={dateRange[1].diff(dateRange[0], "day") === 14 ? "primary" : "default"}
          >
            15 ngày
          </Button>
          <Button
            onClick={() => handleQuickRange(30)}
            type={dateRange[1].diff(dateRange[0], "day") === 29 ? "primary" : "default"}
          >
            30 ngày
          </Button>
        </Space>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (!dates) {
              setToast({ show: true, message: "Vui lòng chọn khoảng thời gian!", type: "error" });
              return;
            }
            setDateRange(dates);
            setCurrentPages({ appointment: 1, revenue: 1, status: 1, paymentType: 1 });
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
                Tổng lịch đặt
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
                Tổng doanh thu
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
                Hoàn thành khám bệnh
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
                Đã thanh toán đầy đủ
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
                Xu hướng lịch hẹn theo thời gian
              </span>
            }
            loading={loading.appointmentTrend}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {appointmentData.length > 0 ? (
              <Line {...appointmentLineConfig} />
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                Không có dữ liệu trong khoảng thời gian này
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <BarChartOutlined style={{ marginRight: 8, color: "#3498db" }} />
                Số lượng lịch hẹn mỗi ngày
              </span>
            }
            loading={loading.appointmentTrend}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {appointmentData.length > 0 ? (
              <Bar {...appointmentBarConfig} />
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                Không có dữ liệu trong khoảng thời gian này
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
                Xu hướng doanh thu theo thời gian
              </span>
            }
            loading={loading.revenueTrend}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {revenueData.length > 0 ? (
              <Line {...revenueLineConfig} />
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                Không có dữ liệu trong khoảng thời gian này
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <PieChartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                Phân bố trạng thái lịch hẹn
              </span>
            }
            loading={loading.appointmentStatus}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            {appointmentStatusData.length > 0 ? (
              <Bar {...appointmentStatusConfig} />
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                Không có dữ liệu trong khoảng thời gian này
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
                  Lịch hẹn theo ngày
                </span>
              }
              loading={loading.appointmentTrend}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
              extra={
                <Space>
                  <span>Hiển thị:</span>
                  <Select
                    value={pageSizes.appointment}
                    onChange={(value) => {
                      setPageSizes((prev) => ({ ...prev, appointment: value }));
                      setCurrentPages((prev) => ({ ...prev, appointment: 1 }));
                    }}
                    style={{ width: 80 }}
                  >
                    <Option value={10}>10</Option>
                    <Option value={25}>25</Option>
                    <Option value={50}>50</Option>
                  </Select>
                  <span>mục</span>
                </Space>
              }
            >
              <Table
                columns={appointmentColumns}
                dataSource={appointmentData}
                rowKey="date"
                pagination={customPagination(appointmentData, "appointment")}
                bordered
                locale={{ emptyText: "Không có dữ liệu trong khoảng thời gian này" }}
                footer={() => (
                  <div>
                    Hiển thị {(currentPages.appointment - 1) * pageSizes.appointment + 1} đến{" "}
                    {Math.min(currentPages.appointment * pageSizes.appointment, appointmentData.length)} của{" "}
                    {appointmentData.length} mục
                  </div>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title={
                <span>
                  <DollarOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                  Doanh thu theo ngày
                </span>
              }
              loading={loading.revenueTrend}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
              extra={
                <Space>
                  <span>Hiển thị:</span>
                  <Select
                    value={pageSizes.revenue}
                    onChange={(value) => {
                      setPageSizes((prev) => ({ ...prev, revenue: value }));
                      setCurrentPages((prev) => ({ ...prev, revenue: 1 }));
                    }}
                    style={{ width: 80 }}
                  >
                    <Option value={10}>10</Option>
                    <Option value={25}>25</Option>
                    <Option value={50}>50</Option>
                  </Select>
                  <span>mục</span>
                </Space>
              }
            >
              <Table
                columns={revenueColumns}
                dataSource={revenueData}
                rowKey="date"
                pagination={customPagination(revenueData, "revenue")}
                bordered
                locale={{ emptyText: "Không có dữ liệu trong khoảng thời gian này" }}
                footer={() => (
                  <div>
                    Hiển thị {(currentPages.revenue - 1) * pageSizes.revenue + 1} đến{" "}
                    {Math.min(currentPages.revenue * pageSizes.revenue, revenueData.length)} của{" "}
                    {revenueData.length} mục
                  </div>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title={
                <span>
                  <PieChartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                  Phân bố trạng thái lịch hẹn
                </span>
              }
              loading={loading.appointmentStatus}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
              extra={
                <Space>
                  <span>Hiển thị:</span>
                  <Select
                    value={pageSizes.status}
                    onChange={(value) => {
                      setPageSizes((prev) => ({ ...prev, status: value }));
                      setCurrentPages((prev) => ({ ...prev, status: 1 }));
                    }}
                    style={{ width: 80 }}
                  >
                    <Option value={10}>10</Option>
                    <Option value={25}>25</Option>
                    <Option value={50}>50</Option>
                  </Select>
                  <span>mục</span>
                </Space>
              }
            >
              <Table
                columns={appointmentStatusColumns}
                dataSource={appointmentStatusData}
                rowKey="status"
                pagination={customPagination(appointmentStatusData, "status")}
                bordered
                locale={{ emptyText: "Không có dữ liệu trong khoảng thời gian này" }}
                footer={() => (
                  <div>
                    Hiển thị {(currentPages.status - 1) * pageSizes.status + 1} đến{" "}
                    {Math.min(currentPages.status * pageSizes.status, appointmentStatusData.length)} của{" "}
                    {appointmentStatusData.length} mục
                  </div>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title={
                <span>
                  <CreditCardOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                  Doanh thu theo loại thanh toán
                </span>
              }
              loading={loading.paymentType}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
              extra={
                <Space>
                  <span>Hiển thị:</span>
                  <Select
                    value={pageSizes.paymentType}
                    onChange={(value) => {
                      setPageSizes((prev) => ({ ...prev, paymentType: value }));
                      setCurrentPages((prev) => ({ ...prev, paymentType: 1 }));
                    }}
                    style={{ width: 80 }}
                  >
                    <Option value={10}>10</Option>
                    <Option value={25}>25</Option>
                    <Option value={50}>50</Option>
                  </Select>
                  <span>mục</span>
                </Space>
              }
            >
              <Table
                columns={paymentTypeColumns}
                dataSource={paymentTypeData}
                rowKey="type"
                pagination={customPagination(paymentTypeData, "paymentType")}
                bordered
                locale={{ emptyText: "Không có dữ liệu trong khoảng thời gian này" }}
                footer={() => (
                  <div>
                    Hiển thị {(currentPages.paymentType - 1) * pageSizes.paymentType + 1} đến{" "}
                    {Math.min(currentPages.paymentType * pageSizes.paymentType, paymentTypeData.length)} của{" "}
                    {paymentTypeData.length} mục
                  </div>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AppointmentStats;