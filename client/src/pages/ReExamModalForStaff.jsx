import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { DatePicker } from "antd";

export default function ReExamModalForStaff({
  open, rootAppointment, token, onClose, onSuccess
}) {
  const [timeslots, setTimeslots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeslot, setSelectedTimeslot] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    if (open && rootAppointment) {
      setLoading(true);
      setNote("");
      setSelectedTimeslot("");
      setSelectedDate(null);
      setMessage(""); setMessageType("info");
      const doctorId = rootAppointment.doctorId?._id || rootAppointment.doctorId;
      axios.get(`http://localhost:9999/app/timeslots/by-doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setTimeslots(res.data.data || []))
        .catch(() => setTimeslots([]))
        .finally(() => setLoading(false));
    }
  }, [open, rootAppointment, token]);

  useEffect(() => { setSelectedTimeslot(""); }, [selectedDate]);

  const validDaysSet = React.useMemo(() => {
    const today = dayjs().startOf("day");
    const days = new Set();
    timeslots.forEach(ts => {
      const d = dayjs(ts.date);
      if (d.diff(today, "day") >= 1) days.add(d.format("YYYY-MM-DD"));
    });
    return days;
  }, [timeslots]);

  const filteredTimeslots = selectedDate
    ? timeslots.filter(ts => dayjs(ts.date).isSame(selectedDate, "day"))
    : [];

  const getDayDisabled = current => {
    if (!current) return true;
    const isBefore = current.isBefore(dayjs().add(1, "day").startOf("day"));
    const isValid = validDaysSet.has(current.format("YYYY-MM-DD"));
    return isBefore || !isValid;
  };

  const handleClose = () => {
    setTimeslots([]); setSelectedDate(null); setSelectedTimeslot("");
    setNote(""); setMessage(""); setMessageType("info");
    onClose && onClose();
  };

  const handleSubmit = async () => {
    setMessage(""); setMessageType("info");
    if (!selectedDate) {
      setMessage("Vui lòng chọn ngày tái khám!"); setMessageType("error"); return;
    }
    if (!selectedTimeslot) {
      setMessage("Vui lòng chọn khung giờ tái khám!"); setMessageType("error"); return;
    }
    setLoading(true);
    try {
      await axios.post(
        `http://localhost:9999/app/re-examination/${rootAppointment._id}`,
        { timeslotId: selectedTimeslot, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Đặt lịch tái khám thành công!"); setMessageType("success");
      setTimeout(() => {
        onSuccess && onSuccess();
        handleClose();
      }, 1000);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Lỗi khi đặt lịch tái khám!"
      ); setMessageType("error");
    }
    setLoading(false);
  };

  if (!open) return null;
  const service = rootAppointment.service || rootAppointment.serviceId;
  const doctor = rootAppointment.doctorUser || rootAppointment.doctorId?.userId || {};
  const patient = rootAppointment.patientUser || rootAppointment.patientId?.userId || {};
  const option = rootAppointment.serviceOption || rootAppointment.serviceOptionId;

  return (
    <div
      style={{
        position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
        background: "rgba(20,30,40,0.22)", zIndex: 20000,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}
      onClick={handleClose}
    >
      <div
        style={{
          minWidth: 500,
          maxWidth: 700,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 30px 0 #2159fb12",
          padding: "0px 0px 28px 0px",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient đồng bộ */}
        <div style={{
          borderRadius: "16px 16px 0 0",
          width: "100%",
          padding: "22px 28px 12px 28px",
          background: "linear-gradient(90deg,#127afc 60%,#12dede 100%)",
          color: "#fff"
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>Đặt lịch tái khám</div>
          <div style={{ fontSize: 15, marginTop: 4, opacity: 0.96 }}>
            Điền đầy đủ thông tin tái khám cho bệnh nhân
          </div>
        </div>

        {/* Thông báo tương tự PaymentModalFinal */}
        {message && (
          <div style={{
            margin: "18px 25px 0 25px",
            padding: "13px 16px",
            borderRadius: 8,
            background: messageType === "error" ? "#ffefef"
              : messageType === "success" ? "#f0fff5"
                : "#f9fbfd",
            border: messageType === "error" ? "1.3px solid #f80d1c33"
              : messageType === "success" ? "1.3px solid #32db7b44"
                : "1.1px solid #dde6f2",
            color: messageType === "error" ? "#b91529"
              : messageType === "success" ? "#058e60" : "#2159aa",
            fontWeight: 500,
            fontSize: 15,
            minHeight: 18,
            marginBottom: 3
          }}>
            {message}
          </div>
        )}

        <div style={{ padding: "4px 24px 4px 24px" }}>
          <div style={{ margin: "22px 0 18px 0" }}>
            <div style={{ marginBottom: 7, fontWeight: 600, fontSize: 17, color: "#127afc" }}>
              {patient.fullname}
            </div>
            <div style={{
              color: "#109d42", background: "#f5f9fa", display: "inline-block",
              fontWeight: 500, borderRadius: 6, fontSize: 15, padding: "2px 15px"
            }}>
              {service?.serviceName || ""}
              {option?.optionName ? ` - ${option.optionName}` : ""}
            </div>
          </div>
          <div style={{
            border: "1px solid #d3e6fa",
            background: "#f7fcfe",
            borderRadius: 10,
            padding: "18px 20px",
            marginBottom: 18,
            boxShadow: "0 2px 8px #edf4fa"
          }}>
            <div style={{ marginBottom: 6 }}>
              <span><b>Bác sĩ:</b> {doctor.fullname || "?"}</span>
            </div>
            <div>
              <span><b>Lịch gốc:</b> {rootAppointment.timeslot?.date
                ? dayjs(rootAppointment.timeslot.date || rootAppointment.timeslotId?.date).format("DD/MM/YYYY")
                : "?"}
                {rootAppointment.timeslot?.start_time
                  ? ` (${rootAppointment.timeslot.start_time} - ${rootAppointment.timeslot.end_time})`
                  : ""}
              </span>
            </div>
          </div>
          {/* Chọn ngày tái khám */}
          <div style={{ marginBottom: 13 }}>
            <label style={{ fontWeight: 500 }}>Chọn ngày tái khám:</label><br />
            <DatePicker
              style={{ width: "100%", marginTop: 7 }}
              format="DD/MM/YYYY"
              value={selectedDate}
              getPopupContainer={trigger => trigger.parentNode}
              disabledDate={getDayDisabled}
              onChange={val => setSelectedDate(val)}
              placeholder="Chọn ngày tái khám"
              allowClear
            />
          </div>
          {/* Chọn khung giờ */}
          <div style={{ marginBottom: 17 }}>
            <label style={{ fontWeight: 500 }}>Chọn khung giờ:</label>
            <select
              style={{
                width: "100%", border: "1.2px solid #dde1ea", borderRadius: 7,
                fontSize: 17, padding: "10px 15px", outline: "none", marginTop: 7
              }}
              disabled={loading || !selectedDate}
              value={selectedTimeslot}
              onChange={e => setSelectedTimeslot(e.target.value)}
            >
              <option value="">-- Chọn khung giờ --</option>
              {filteredTimeslots
                .filter(ts => ts.isAvailable)
                .map(ts =>
                  <option key={ts._id} value={ts._id}>
                    {dayjs(ts.date).format("DD/MM/YYYY")} ({ts.start_time} - {ts.end_time})
                  </option>
                )}
            </select>
          </div>
          {/* Ghi chú */}
          <div style={{ marginBottom: 15 }}>
            <label style={{ fontWeight: 500 }}>Ghi chú (nếu có):</label>
            <textarea
              style={{
                width: "100%", padding: 10, borderRadius: 6,
                border: "1.2px solid #dde2ea", fontSize: 15, minHeight: 42
              }}
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={loading}
            />
          </div>
          {/* Nút hành động */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 13,
            marginTop: 28
          }}>
            <button
              style={{
                background: "#eee", color: "#888", borderRadius: 8,
                minWidth: 70, padding: "11px 26px", border: "none", fontWeight: 600,
                fontSize: 16, boxShadow: "0 2px 8px #eee"
              }}
              onClick={handleClose}
              disabled={loading}
            >
              Huỷ
            </button>
            <button
              style={{
                background: "#127afc", color: "#fff",
                minWidth: 112, borderRadius: 8, padding: "11px 22px",
                fontWeight: 700, border: "none", fontSize: 16,
                boxShadow: "0 2px 10px #14b2ea69",
                opacity: loading ? 0.66 : 1, pointerEvents: loading ? "none" : "auto"
              }}
              onClick={handleSubmit}
              disabled={loading}
            >
              Xác nhận
            </button>
          </div>
          {loading && (
            <div style={{ marginTop: 10, color: "#888", fontStyle: "italic", textAlign: "center" }}>
              Đang xử lý ...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
