import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Input, message, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import "../assets/css/PatientAppointmentPage.css"; // link css bạn gửi

const PatientAppointmentPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [refundAccount, setRefundAccount] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const userId = JSON.parse(atob(token.split(".")[1])).userId;
      const res = await axios.get(
        `http://localhost:9999/app/patient/${userId}`
      );
      if (res.data.success) {
        setAppointments(res.data.data.appointments);
        setPatientInfo(res.data.data.patient);
      } else {
        message.error("Không thể tải lịch sử đặt lịch.");
      }
    } catch (error) {
      console.error(error);
      message.error("Đã xảy ra lỗi khi tải lịch sử.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const showCancelModal = (id) => {
    setCancelId(id);
    setIsModalVisible(true);
  };

  const showEditModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsEditModalVisible(true);
  };

  const handleCancelAppointment = async () => {
    if (!refundAccount) {
      message.warning("⚠️ Vui lòng nhập số tài khoản ngân hàng để hoàn tiền.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:9999/app/cancel/${cancelId}`,
        { refundAccount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success(
        "✅ Hủy lịch thành công! Chúng tôi sẽ hoàn trả tiền trong thời gian ngắn."
      );

      setIsModalVisible(false);
      setRefundAccount("");
      setCancelId(null);

      await fetchAppointments();
    } catch (error) {
      message.error(error.response?.data?.message || "❌ Hủy lịch thất bại.");
    }
  };

  const handleUpdateAppointment = (updatedAppointment) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt._id === updatedAppointment._id ? updatedAppointment : appt
      )
    );
    setIsEditModalVisible(false);
    setSelectedAppointment(null);
  };

  const columns = [
    {
      title: "STT",
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      title: "Gói dịch vụ",
      dataIndex: ["serviceOptionId", "optionName"],
    },
    {
      title: "Phòng khám",
      dataIndex: ["clinicId", "clinic_name"],
    },
    {
      title: "Bác sĩ",
      dataIndex: ["doctorId", "userId", "fullname"],
    },
    {
      title: "Ngày khám",
      dataIndex: ["timeslotId", "date"],
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Giờ khám",
      dataIndex: "timeslotId",
      render: (timeslot) => `${timeslot.start_time} - ${timeslot.end_time}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => {
        let color;
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
          default:
            color = "default";
        }
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      render: (createdAt) => dayjs(createdAt).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Hành động",
      render: (text, record) => {
        const isCancelled = record.status === "cancelled";
        const canCancelOrChange =
          dayjs(record.timeslotId.date).diff(dayjs(), "hour") >= 8;

        if (isCancelled) {
          return <Button disabled>Đã huỷ</Button>;
        }

        return (
          <div className="flex space-x-2">
            {canCancelOrChange ? (
              <Button
                type="primary"
                danger
                onClick={() => showCancelModal(record._id)}
              >
                Huỷ lịch
              </Button>
            ) : (
              <Button disabled>Không thể huỷ</Button>
            )}
            <Button
              type="primary"
              onClick={() => showEditModal(record)}
              disabled={!canCancelOrChange}
            >
              Đổi lịch
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Lịch sử đặt lịch khám</h2>

      {patientInfo && (
        <div className="mb-4">
          <p>
            <strong>Bệnh nhân:</strong> {patientInfo.fullname}
          </p>
          <p>
            <strong>Email:</strong> {patientInfo.email}
          </p>
          <p>
            <strong>SĐT:</strong> {patientInfo.phone}
          </p>
        </div>
      )}

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={appointments}
        loading={loading}
        bordered
        pagination={{ pageSize: 6 }}
      />

      <Modal
        title="Nhập số tài khoản ngân hàng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleCancelAppointment}
        okText="Xác nhận huỷ"
        cancelText="Thoát"
      >
        <Input
          placeholder="Nhập STK ngân hàng để hoàn tiền"
          value={refundAccount}
          onChange={(e) => setRefundAccount(e.target.value)}
        />
      </Modal>

      <EditAppointment
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        appointment={selectedAppointment}
        onUpdate={handleUpdateAppointment}
      />
    </div>
  );
};

export default PatientAppointmentPage;
