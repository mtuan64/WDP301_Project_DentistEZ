import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  DatePicker,
  Select,
  message,
  Tag,
  Button,
  Popconfirm,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const fetchRefunds = async () => {
    try {
      const res = await axios.get("http://localhost:9999/app/refunds");
      console.log("Fetched refunds:", res.data.data);
      
      const sorted = res.data.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRefunds(sorted);
      setFilteredRefunds(sorted);
    } catch (err) {
      message.error("Lỗi khi tải danh sách hoàn tiền");
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchText, dateRange, statusFilter, serviceFilter]);

  const filterData = () => {
    let data = [...refunds];

    if (searchText) {
      data = data.filter((refund) =>
        refund.appointmentId?.patientId?.userId?.fullname
          ?.toLowerCase()
          .includes(searchText.toLowerCase())
      );
    }

    if (dateRange.length === 2) {
      const [start, end] = dateRange;
      data = data.filter((refund) => {
        const createdAt = dayjs(refund.createdAt);
        return createdAt.isAfter(start) && createdAt.isBefore(end);
      });
    }

    if (statusFilter) {
      data = data.filter((refund) => refund.status === statusFilter);
    }

    if (serviceFilter) {
      data = data.filter(
        (refund) =>
          refund.appointmentId?.serviceId?.serviceName === serviceFilter
      );
    }

    setFilteredRefunds(data);
  };

  const resetFilters = () => {
    setSearchText("");
    setDateRange([]);
    setStatusFilter("");
    setServiceFilter("");
    fetchRefunds();
  };

  const handleConfirmRefund = async (id) => {
    try {
      await axios.put(`http://localhost:9999/app/refunds/confirm/${id}`);
      message.success("Xác nhận hoàn tiền thành công");
      fetchRefunds(); // cập nhật lại dữ liệu
    } catch (error) {
      console.error("Lỗi xác nhận hoàn tiền:", error);
      message.error("Xác nhận hoàn tiền thất bại");
    }
  };

  const serviceOptions = Array.from(
    new Set(
      refunds
        .map((r) => r.appointmentId?.serviceId?.serviceName)
        .filter(Boolean)
    )
  );

  const columns = [
    {
      title: "Tên bệnh nhân",
      render: (_, record) =>
        record.appointmentId?.patientId?.userId?.fullname || "N/A",
    },
    {
      title: "Gói dịch vụ",
      render: (_, record) =>
        record.appointmentId?.serviceId?.serviceName || "N/A",
    },
    {
      title: "Dịch vụ",
      render: (_, record) =>
        record.appointmentId?.serviceOptionId?.optionName || "N/A",
    },
    {
      title: "Phòng khám",
      render: (_, record) =>
        record.appointmentId?.clinicId?.clinic_name || "N/A",
    },
    {
      title: "Bác sĩ",
      render: (_, record) =>
        record.appointmentId?.doctorId?.userId?.fullname || "N/A",
    },
    {
      title: "Thời gian hẹn",
      render: (_, record) => {
        const ts = record.appointmentId?.timeslotId;
        return ts
          ? `${dayjs(ts.date).format("DD/MM/YYYY")} - ${ts.start_time} ~ ${
              ts.end_time
            }`
          : "N/A";
      },
    },
    {
      title: "Ngân hàng",
      dataIndex: "refundBank",
    },
    {
      title: "Số tài khoản",
      dataIndex: "refundAccount",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "pending" ? "orange" : "green"}>
          {status === "pending" ? "Đang xử lý" : "Đã hoàn tiền"}
        </Tag>
      ),
    },
    {
      title: "Tạo lúc",
      dataIndex: "createdAt",
      render: (date) => dayjs(date).format("HH:mm DD/MM/YYYY"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) =>
        record.status === "pending" ? (
          <Button
            type="primary"
            onClick={() => handleConfirmRefund(record._id)}
            size="small"
          >
            Xác nhận
          </Button>
        ) : (
          <Tag color="green">Đã hoàn tiền</Tag>
        ),
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Quản lý hoàn tiền</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <Input
          placeholder="Tìm tên bệnh nhân"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 220 }}
        />
        <RangePicker
          onChange={(dates) => setDateRange(dates || [])}
          value={dateRange}
          style={{ width: 280 }}
        />
        <Select
          placeholder="Trạng thái"
          value={statusFilter || undefined}
          onChange={(val) => setStatusFilter(val)}
          allowClear
          style={{ width: 180 }}
        >
          <Option value="pending">Đang xử lý</Option>
          <Option value="refunded">Đã hoàn tiền</Option>
        </Select>
        <Select
          placeholder="Gói dịch vụ"
          value={serviceFilter || undefined}
          onChange={(val) => setServiceFilter(val)}
          allowClear
          style={{ width: 220 }}
        >
          {serviceOptions.map((name) => (
            <Option key={name} value={name}>
              {name}
            </Option>
          ))}
        </Select>
        <Button onClick={resetFilters}>Đặt lại bộ lọc</Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredRefunds}
        rowKey="_id"
        bordered
        pagination={{ pageSize: 6 }}
      />
    </div>
  );
};

export default RefundManagement;
