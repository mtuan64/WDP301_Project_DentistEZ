import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Card,
  Descriptions,
  Spin,
  Alert,
  Divider,
  Table,
  Tag,
  Button,
  message,
  Modal,
} from "antd";
import dayjs from "dayjs";
import EditAppointment from "./EditAppointment";

// Kiểm tra lịch có cách thời điểm hiện tại dưới 8 tiếng không
const isWithin8Hours = (timeslot) => {
  if (!timeslot?.date || !timeslot?.start_time) return false;
  const appointmentTime = dayjs(
    `${timeslot.date} ${timeslot.start_time}`,
    "YYYY-MM-DD HH:mm"
  );
  const currentTime = dayjs();
  return appointmentTime.isBefore(currentTime.add(8, "hour"));
};

const ReExaminationTable = ({ appointments, onEdit, onCancel }) => {
  const columns = [
    {
      title: "STT",
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: "Dịch vụ",
      dataIndex: ["serviceId", "serviceName"],
      render: (_, record) => record.serviceId?.serviceName || "",
    },
    {
      title: "Bác sĩ",
      dataIndex: ["doctorId", "userId", "fullname"],
      render: (_, record) => record.doctorId?.userId?.fullname || "",
    },
    {
      title: "Ngày khám",
      dataIndex: ["timeslotId", "date"],
      render: (_, record) =>
        record.timeslotId?.date
          ? dayjs(record.timeslotId.date).format("DD/MM/YYYY")
          : "?",
    },
    {
      title: "Giờ khám",
      dataIndex: "timeslotId",
      render: (timeslot) =>
        timeslot ? `${timeslot.start_time} - ${timeslot.end_time}` : "",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => {
        let color = "default";
        switch (status) {
          case "pending":
            color = "orange";
            break;
          case "confirmed":
            color = "blue";
            break;
          case "completed":
            color = "green";
            break;
          case "cancelled":
            color = "red";
            break;
          case "fully_paid":
            color = "purple";
            break;
          default:
            color = "default";
        }
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : ""),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
    },
    {
      title: "Hành động",
      render: (_, record) => {
        const isCancelled = record.status === "cancelled";
        return (
          <div className="flex space-x-2">
            <Button
              type="primary"
              danger
              disabled={isCancelled || !isWithin8Hours(record.timeslotId)}
              onClick={() => onCancel(record._id)}
            >
              {isCancelled ? "Đã huỷ" : "Huỷ lịch"}
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={() => onEdit(record)}
              disabled={
                record.status === "completed" ||
                record.status === "cancelled" ||
                isWithin8Hours(record.timeslotId)
              }
            >
              Đổi lịch
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={appointments}
      pagination={false}
      rowKey={(record) => record._id}
      bordered
    />
  );
};

const ReDetail = () => {
  const { id } = useParams();
  const [root, setRoot] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notification, setNotification] = useState({
    visible: false,
    title: "",
    content: "",
    onOk: null,
  });

  const showNotification = (title, content, onOk = null) => {
    setNotification({ visible: true, title, content, onOk });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, visible: false }));
    if (notification.onOk) {
      notification.onOk();
    }
  };

  useEffect(() => {
    const fetchAPI = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:9999/app/re-examinations/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (data.success) {
          setRoot(data.data.root);
          setAppointments(data.data.reExaminations);
        } else {
          setError(data.message || "Không tìm thấy lịch tái khám");
        }
      } catch (e) {
        setError("Lỗi khi load dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    fetchAPI();
  }, [id]);

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setEditModalVisible(true);
  };

  const handleUpdate = (updatedAppointment) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt._id === updatedAppointment._id ? updatedAppointment : appt
      )
    );
    setEditModalVisible(false);
    setSelectedAppointment(null);
  };

  const handleCancel = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:9999/app/cancel/${appointmentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification("Thành công", "✅ Huỷ lịch thành công!", () => {
        setAppointments((prev) =>
          prev.map((appt) =>
            appt._id === appointmentId ? { ...appt, status: "cancelled" } : appt
          )
        );
      });
    } catch (error) {
      showNotification(
        "Lỗi",
        error.response?.data?.message || "❌ Hủy lịch thất bại."
      );
    }
  };

  if (loading) return <Spin style={{ marginTop: 56, display: "block" }} />;
  if (error)
    return <Alert type="error" message={error} style={{ margin: 32 }} />;

  return (
    <div style={{ maxWidth: 1000, margin: "30px auto 0", padding: 16 }}>
      {root && (
        <Card title="Thông tin lịch khám gốc" style={{ marginBottom: 32 }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Bệnh nhân">
              {root.patientId?.userId?.fullname}
            </Descriptions.Item>
            <Descriptions.Item label="Bác sĩ">
              {root.doctorId?.userId?.fullname}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              {root.serviceId?.serviceName}
            </Descriptions.Item>
            <Descriptions.Item label="Phòng khám">
              {root.clinicId?.clinic_name}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày khám">
              {root.timeslotId?.date
                ? dayjs(root.timeslotId.date).format("DD/MM/YYYY")
                : "?"}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ khám">
              {root.timeslotId?.start_time && root.timeslotId?.end_time
                ? `${root.timeslotId.start_time} - ${root.timeslotId.end_time}`
                : "?"}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">{root.note}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <span style={{ textTransform: "capitalize" }}>
                {root.status}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
      <Divider orientation="left" style={{ fontWeight: 600 }}>
        Lịch sử các lần tái khám
      </Divider>
      <ReExaminationTable
        appointments={appointments}
        onEdit={handleEdit}
        onCancel={handleCancel}
      />
      {selectedAppointment && (
        <EditAppointment
          visible={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          appointment={selectedAppointment}
          onUpdate={handleUpdate}
        />
      )}
      <Modal
        title={notification.title}
        open={notification.visible}
        onOk={handleCloseNotification}
        onCancel={handleCloseNotification}
        okText="Đóng"
        centered
      >
        <p>{notification.content}</p>
      </Modal>
    </div>
  );
};

export default ReDetail;
