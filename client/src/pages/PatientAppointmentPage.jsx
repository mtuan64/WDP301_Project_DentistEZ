import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Input, message, Tag, DatePicker } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import locale from "antd/es/date-picker/locale/vi_VN";
import { useNavigate } from "react-router-dom";
import { EyeOutlined } from "@ant-design/icons";
import EditAppointment from "./EditAppointment";
import "../assets/css/PatientAppointmentPage.css";

const PatientAppointmentPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [refundAccount, setRefundAccount] = useState("");
  const [refundBank, setRefundBank] = useState("");
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isReExamModalVisible, setIsReExamModalVisible] = useState(false);
  const [reExamAppointment, setReExamAppointment] = useState(null);
  const [reExamTimeslots, setReExamTimeslots] = useState([]);
  const [selectedTimeslotId, setSelectedTimeslotId] = useState("");
  const [isReExamSubmitting, setIsReExamSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [reExamNote, setReExamNote] = useState("");
  const [reExamModalError, setReExamModalError] = useState("");
  const navigate = useNavigate();

  // Xử lý timeslot ra date chuẩn cho mọi trường hợp:
  const cleanedTimeslots = reExamTimeslots.map((slot) => ({
    ...slot,
    cleanedDate: dayjs(slot.date).format("YYYY-MM-DD"),
  }));

  // List ngày hợp lệ cho DatePicker:
  const validDays = [
    ...new Set(
      cleanedTimeslots
        .filter((slot) => slot.isAvailable && slot.status === "active")
        .map((slot) => slot.cleanedDate)
    ),
  ];

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
    setIsCancelModalVisible(true);
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
        { refundAccount, refundBank },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Hủy lịch thành công!");
      fetchAppointments();
      setIsCancelModalVisible(false);
      setRefundAccount("");
      setRefundBank("");
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

  const handleReExam = async (appointment) => {
    setReExamAppointment(appointment);
    setIsReExamModalVisible(true);
    setSelectedTimeslotId("");
    setSelectedDate("");
    try {
      const token = localStorage.getItem("token");
      const doctorId = appointment.doctorId._id || appointment.doctorId;
      const res = await axios.get(
        `http://localhost:9999/app/timeslots/by-doctor/${doctorId}`,
        {
          params: { doctorId: doctorId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReExamTimeslots(res.data.data || []);
    } catch (err) {
      setReExamTimeslots([]);
      message.error("Không lấy được danh sách khung giờ tái khám");
    }
  };

  const appointmentsWithReExams = appointments
    .filter((app) => !app.reExaminationOf)
    .map((app) => ({
      ...app,
      reExaminations: appointments.filter(
        (a) => String(a.reExaminationOf) === String(app._id)
      ),
    }));

  const columns = [
    {
      title: "STT",
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      title: "Dịch vụ",
      render: (text, record) => (
        <div>
          <div>{record.serviceId?.serviceName}</div>
          {record.serviceOptionId && (
            <div style={{ color: "#888", fontSize: 13 }}>
              {record.serviceOptionId.optionName}
              {record.serviceOptionId.price && (
                <> - {Number(record.serviceOptionId.price).toLocaleString()}₫</>
              )}
            </div>
          )}
        </div>
      ),
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
          case "fully_paid":
            color = "purple";
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
      title: "Tái Khám",
      render: (text, record) => {
        const reExamList = record.reExaminations || [];
        if (!reExamList.length)
          return <span style={{ color: "#888" }}>(Chưa có)</span>;
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <div>
              {reExamList.map((exam, idx) => (
                <div key={exam._id || idx}>
                  <b>Lần {idx + 1}:</b>{" "}
                  {exam.timeslotId?.date
                    ? dayjs(exam.timeslotId.date).format("DD/MM/YYYY")
                    : "?"}{" "}
                  ({exam.timeslotId?.start_time} - {exam.timeslotId?.end_time})
                </div>
              ))}
            </div>
            <div style={{ width: "100%", textAlign: "right", marginTop: 2 }}>
              <EyeOutlined
                title="Xem chi tiết tất cả lần tái khám"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/re-examinations/${record._id}`);
                }}
                style={{
                  color: "#1890ff",
                  fontSize: 22,
                  cursor: "pointer",
                  opacity: 0.85,
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: "Ghi Chú",
      dataIndex: "note",
    },
    {
      title: "Hành động",
      render: (text, record) => {
        const isCancelled = record.status === "cancelled";
        const canCancelOrChange =
          dayjs(record.timeslotId.date).diff(dayjs(), "hour") >= 8 &&
          record.status !== "cancelled";
        const canReExam =
          record.status === "completed" || record.status === "fully_paid";

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
            {canReExam && (
              <Button
                type="default"
                style={{ background: "#68cd35ff" }}
                onClick={() => handleReExam(record)}
              >
                Tái khám
              </Button>
            )}
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
        dataSource={appointmentsWithReExams}
        loading={loading}
        bordered
        pagination={{ pageSize: 6 }}
      />

      <Modal
        title="Nhập số tài khoản ngân hàng"
        open={isCancelModalVisible}
        onCancel={() => setIsCancelModalVisible(false)}
        onOk={handleCancelAppointment}
        okText="Xác nhận huỷ"
        cancelText="Thoát"
      >
        <Input
          placeholder="Nhập STK ngân hàng để hoàn tiền"
          value={refundAccount}
          onChange={(e) => setRefundAccount(e.target.value)}
        />
        <Input
          placeholder="Nhập tên ngân hàng"
          value={refundBank}
          onChange={(e) => setRefundBank(e.target.value)}
        />
      </Modal>

      <EditAppointment
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        appointment={selectedAppointment}
        onUpdate={handleUpdateAppointment}
      />

      <Modal
        title={
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: 22,
              color: "#fff",
              marginBottom: 0,
              background: "linear-gradient(90deg,#127afc 70%,#12dede 100%)",
              padding: "18px 0 9px",
              borderRadius: "12px 12px 0 0",
            }}
          >
            Đặt lịch tái khám
          </div>
        }
        open={isReExamModalVisible}
        onCancel={() => {
          setIsReExamModalVisible(false);
          setReExamModalError("");
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsReExamModalVisible(false);
              setReExamModalError("");
            }}
          >
            Đóng
          </Button>,
          <Button
            key="next"
            type="primary"
            style={{
              background: "#127afc",
              border: "none",
              boxShadow: "0 2px 8px #14b2ea69",
              minWidth: 110,
              fontWeight: 700,
            }}
            loading={isReExamSubmitting}
            disabled={!selectedDate || !selectedTimeslotId}
            onClick={async () => {
              if (!selectedDate || !selectedTimeslotId) {
                message.warning("Vui lòng chọn cả ngày và giờ tái khám!");
                return;
              }
              setIsReExamSubmitting(true);
              try {
                const token = localStorage.getItem("token");
                const res = await axios.post(
                  `http://localhost:9999/app/re-examination/${reExamAppointment._id}`,
                  {
                    serviceId:
                      reExamAppointment.serviceId?._id ||
                      reExamAppointment.serviceId,
                    serviceOptionId:
                      reExamAppointment.serviceOptionId?._id ||
                      reExamAppointment.serviceOptionId,
                    clinicId:
                      reExamAppointment.clinicId?._id ||
                      reExamAppointment.clinicId,
                    timeslotId: selectedTimeslotId,
                    note: reExamNote,
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                message.success(
                  res.data?.message || "Đặt lịch tái khám thành công!"
                );
                setTimeout(() => {
                  fetchAppointments();
                  setIsReExamModalVisible(false);
                  setReExamModalError("");
                }, 500);
              } catch (err) {
                setReExamModalError(
                  err?.response?.data?.message || "Đặt lịch tái khám thất bại!"
                );
              }
              setIsReExamSubmitting(false);
            }}
          >
            Đặt lịch tái khám
          </Button>,
        ]}
        centered
        bodyStyle={{
          background: "#f7fcfe",
          borderRadius: "0 0 12px 12px",
          padding: "28px 36px 18px 36px",
          boxShadow: "0 4px 19px 0 #127afc19",
        }}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 38px 0 #127afc3a",
        }}
      >
        {reExamAppointment && (
          <div
            style={{
              padding: 0,
              background: "none",
              borderRadius: 0,
              minWidth: 340,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            {reExamModalError && (
              <div
                style={{
                  background: "#ffefef",
                  color: "#b91529",
                  border: "1.2px solid #f80d1c33",
                  borderRadius: 7,
                  padding: "10px 16px",
                  marginBottom: 16,
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                {reExamModalError}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <b style={{ color: "#127afc" }}>Dịch vụ:</b>{" "}
              <span>{reExamAppointment.serviceId?.serviceName}</span>
            </div>

            {reExamAppointment.serviceOptionId && (
              <div style={{ marginBottom: 12 }}>
                <b style={{ color: "#089981" }}>Gói tuỳ chọn:</b>{" "}
                <span>
                  {reExamAppointment.serviceOptionId.optionName}
                  {reExamAppointment.serviceOptionId.price && (
                    <>
                      {" "}
                      -{" "}
                      <span style={{ color: "#ff4300" }}>
                        {Number(
                          reExamAppointment.serviceOptionId.price
                        ).toLocaleString()}
                        ₫
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <b style={{ color: "#12b0ee" }}>Phòng khám:</b>{" "}
              <span>{reExamAppointment.clinicId?.clinic_name}</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <b style={{ color: "#8b36e7" }}>Bác sĩ:</b>{" "}
              <span>{reExamAppointment.doctorId?.userId?.fullname}</span>
            </div>

            <div style={{ margin: "18px 0 10px 0" }}>
              <label
                style={{
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 4,
                  color: "#555",
                }}
              >
                Ghi chú (tuỳ chọn)
              </label>
              <Input.TextArea
                value={reExamNote}
                onChange={(e) => setReExamNote(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Ghi chú thêm cho bác sĩ..."
                style={{
                  resize: "vertical",
                  borderRadius: 6,
                  border: "1.2px solid #dde1ea",
                }}
              />
            </div>

            <div style={{ margin: "10px 0" }}>
              <label
                style={{
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Ngày tái khám <span style={{ color: "#ff4d4f" }}>*</span>
              </label>
              <DatePicker
                style={{
                  width: "100%",
                  borderRadius: 7,
                  border: "1.2px solid #dde1ea",
                  fontSize: 15,
                }}
                locale={locale}
                placeholder="Chọn ngày tái khám"
                format="DD/MM/YYYY"
                value={
                  selectedDate && dayjs(selectedDate).isValid()
                    ? dayjs(selectedDate)
                    : null
                }
                disabledDate={(current) =>
                  current &&
                  current.startOf("day").isBefore(dayjs().startOf("day"))
                }
                onChange={(dateObj) => {
                  setSelectedDate(
                    dateObj && dateObj.isValid()
                      ? dateObj.format("YYYY-MM-DD")
                      : ""
                  );
                  setSelectedTimeslotId("");
                }}
              />
            </div>

            <div style={{ margin: "10px 0 24px 0" }}>
              <label
                style={{
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Khung giờ <span style={{ color: "#ff4d4f" }}>*</span>
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 7,
                  border: "1.2px solid #dde1ea",
                  background: "#fff",
                  fontSize: 15,
                }}
                value={selectedTimeslotId}
                onChange={(e) => setSelectedTimeslotId(e.target.value)}
                disabled={!selectedDate}
              >
                <option value="">-- Chọn khung giờ --</option>
                {selectedDate &&
                  (() => {
                    const shownLabels = new Set();
                    const uniqueSlots = [];
                    cleanedTimeslots
                      .filter(
                        (slot) =>
                          slot.cleanedDate === selectedDate &&
                          slot.isAvailable &&
                          slot.status === "active"
                      )
                      .forEach((slot) => {
                        const label = `${slot.start_time} - ${slot.end_time}`;
                        if (!shownLabels.has(label)) {
                          shownLabels.add(label);
                          uniqueSlots.push(slot);
                        }
                      });
                    return uniqueSlots.map((slot) => (
                      <option key={slot._id} value={slot._id}>
                        {slot.start_time} - {slot.end_time}
                      </option>
                    ));
                  })()}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatientAppointmentPage;
