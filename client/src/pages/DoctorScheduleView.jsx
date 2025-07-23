import React, { useState, useEffect } from "react";
import "../assets/css/DoctorSchedulePage.css";
import axios from "axios";
import { Visibility } from "@mui/icons-material";

// Notification Component
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`ds-notification ${type}`}>
      <span className="ds-notification-message">{message}</span>
      <button className="ds-notification-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

// DoctorSelector Component
const DoctorSelector = ({ onDoctorChange, onClinicInfoChange }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:9999/api/doctor", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (response.data.success) {
          setDoctors(response.data.data);
        } else {
          setNotification({
            message: response.data.message || "Không thể tải danh sách bác sĩ",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách bác sĩ:", error);
        setNotification({
          message: "Lỗi khi tải danh sách bác sĩ!",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const fetchDoctorClinic = async (doctorId) => {
    try {
      const response = await axios.get(
        `http://localhost:9999/api/doctor/${doctorId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success && response.data.data.clinic_id) {
        onClinicInfoChange({
          name: response.data.data.clinic_id.clinic_name,
          description: response.data.data.clinic_id.description,
        });
      } else {
        onClinicInfoChange(null);
        setNotification({
          message: "Không tìm thấy thông tin phòng khám của bác sĩ",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin phòng khám:", error);
      onClinicInfoChange(null);
      setNotification({
        message: "Lỗi khi tải thông tin phòng khám!",
        type: "error",
      });
    }
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
    onDoctorChange(doctorId);
    if (doctorId) {
      fetchDoctorClinic(doctorId);
    } else {
      onClinicInfoChange(null);
    }
  };

  return (
    <div className="ds-doctor-selector">
      <label>Chọn bác sĩ:</label>
      <select
        value={selectedDoctor}
        onChange={handleDoctorChange}
        disabled={loading}
        className="ds-doctor-select"
      >
        <option value="">-- Chọn bác sĩ --</option>
        {doctors.map((doctor) => (
          <option key={doctor._id} value={doctor._id}>
            {doctor.userId.fullname}
          </option>
        ))}
      </select>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

// Main DoctorScheduleView Component
const DoctorScheduleView = () => {
  const [years, setYears] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [scheduleData, setScheduleData] = useState({});
  const [clinicInfo, setClinicInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);

  const slots = Array.from({ length: 9 }, (_, i) => i + 1);

  // Hàm lấy tuần hiện tại
  const getCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + daysUntilMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return {
      start: startOfWeek.toISOString().split("T")[0],
      end: endOfWeek.toISOString().split("T")[0],
    };
  };

  // Hàm lấy danh sách năm và tuần từ timeslots
  const fetchAvailableYearsAndWeeks = async (doctorId) => {
    try {
      const response = await axios.get(
        `http://localhost:9999/api/timeslots/doctor/${doctorId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        const timeslots = response.data.data;
        const uniqueYears = [
          ...new Set(
            timeslots.map((slot) => new Date(slot.date).getFullYear())
          ),
        ].sort();

        setYears(uniqueYears);

        if (uniqueYears.length > 0) {
          const currentYear = new Date().getFullYear();
          const selectedYear = uniqueYears.includes(currentYear)
            ? currentYear
            : uniqueYears[0];
          setSelectedYear(selectedYear);

          const weeks = [];
          const weekMap = new Map();
          timeslots.forEach((slot) => {
            const date = new Date(slot.date);
            if (date.getFullYear() === selectedYear) {
              const startOfWeek = new Date(date);
              const dayOfWeek = date.getDay();
              const daysUntilMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
              startOfWeek.setDate(date.getDate() + daysUntilMonday);
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);

              const weekKey = `${startOfWeek.toISOString().split("T")[0]}_${
                endOfWeek.toISOString().split("T")[0]
              }`;
              if (!weekMap.has(weekKey)) {
                weekMap.set(weekKey, {
                  start: startOfWeek.toISOString().split("T")[0],
                  end: endOfWeek.toISOString().split("T")[0],
                });
              }
            }
          });

          weeks.push(...weekMap.values());
          weeks.sort((a, b) => new Date(a.start) - new Date(b.start));
          setWeeks(weeks);

          const currentWeek = getCurrentWeek();
          const currentWeekKey = `${currentWeek.start}_${currentWeek.end}`;
          const today = new Date();
          let selectedWeekKey = "";
          if (
            weeks.some((week) => `${week.start}_${week.end}` === currentWeekKey)
          ) {
            selectedWeekKey = currentWeekKey;
            setNotification({
              message: "Đang hiển thị lịch tuần hiện tại",
              type: "info",
            });
          } else {
            const pastWeeks = weeks.filter(
              (week) => new Date(week.end) < today
            );
            if (pastWeeks.length > 0) {
              const latestPastWeek = pastWeeks.reduce((latest, week) =>
                new Date(week.end) > new Date(latest.end) ? week : latest
              );
              selectedWeekKey = `${latestPastWeek.start}_${latestPastWeek.end}`;
              setNotification({
                message:
                  "Không có lịch tuần hiện tại, hiển thị tuần gần nhất trước đó",
                type: "info",
              });
            } else if (weeks.length > 0) {
              selectedWeekKey = `${weeks[0].start}_${weeks[0].end}`;
              setNotification({
                message: "Không có lịch trong quá khứ, hiển thị tuần sớm nhất",
                type: "info",
              });
            }
          }
          setSelectedWeek(selectedWeekKey);

          if (!selectedWeekKey) {
            setNotification({
              message: "Không tìm thấy lịch cho bác sĩ trong năm này",
              type: "error",
            });
          }
        } else {
          setWeeks([]);
          setSelectedWeek("");
          setNotification({
            message: "Không tìm thấy lịch cho bác sĩ này",
            type: "error",
          });
        }
      } else {
        setNotification({
          message:
            response.data.message || "Không tìm thấy lịch cho bác sĩ này",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách năm và tuần:", error);
      setNotification({
        message: "Lỗi khi tải danh sách năm và tuần!",
        type: "error",
      });
    }
  };

  // Hàm format tuần để hiển thị
  const formatWeekRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr =
      String(startDate.getDate()).padStart(2, "0") +
      "/" +
      String(startDate.getMonth() + 1).padStart(2, "0");
    const endStr =
      String(endDate.getDate()).padStart(2, "0") +
      "/" +
      String(endDate.getMonth() + 1).padStart(2, "0");
    return `${startStr} đến ${endStr}`;
  };

  // Hàm lấy lịch làm việc theo tuần
  const fetchScheduleData = async () => {
    if (!selectedDoctor || !selectedWeek) return;
    setLoading(true);
    try {
      const [startDate, endDate] = selectedWeek.split("_");
      const response = await axios.get(
        `http://localhost:9999/api/doctor-schedule?doctorId=${selectedDoctor}&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        const groupedData = {};
        response.data.data.timeslots.forEach((slot) => {
          const dateKey = slot.date.split("T")[0];
          if (!groupedData[dateKey]) {
            groupedData[dateKey] = { slots: [] };
          }
          groupedData[dateKey].slots.push(slot);
        });
        setScheduleData(groupedData);
      } else {
        setNotification({
          message: response.data.message || "Không thể tải lịch làm việc",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch làm việc:", error);
      setNotification({
        message: "Lỗi khi tải lịch làm việc!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy chi tiết cuộc hẹn
  const fetchAppointmentDetails = async (timeslotId) => {
    try {
      const response = await axios.get(
        `http://localhost:9999/api/appointments/timeslot/${timeslotId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setAppointmentDetails(response.data.data);
        setShowModal(true);
      } else {
        setNotification({
          message: response.data.message || "Không thể tải thông tin cuộc hẹn",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin cuộc hẹn:", error);
      setNotification({
        message: "Lỗi khi tải thông tin cuộc hẹn!",
        type: "error",
      });
    }
  };

  // Cập nhật danh sách năm và tuần khi chọn bác sĩ
  useEffect(() => {
    if (selectedDoctor) {
      fetchAvailableYearsAndWeeks(selectedDoctor);
    } else {
      setYears([]);
      setWeeks([]);
      setSelectedYear("");
      setSelectedWeek("");
      setScheduleData({});
      setClinicInfo(null);
    }
  }, [selectedDoctor]);

  // Tải lịch khi chọn tuần hoặc bác sĩ
  useEffect(() => {
    fetchScheduleData();
  }, [selectedWeek, selectedDoctor]);

  // Hàm lấy danh sách ngày trong tuần
  const getWeekDays = (startDate) => {
    const days = [];
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const start = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dayName = dayNames[currentDate.getDay()];
      const dateStr =
        String(currentDate.getDate()).padStart(2, "0") +
        "/" +
        String(currentDate.getMonth() + 1).padStart(2, "0");
      days.push({
        key: dayName,
        label: dayName,
        date: dateStr,
        fullDate: currentDate.toISOString().split("T")[0],
      });
    }
    return days;
  };

  const weekDays = selectedWeek ? getWeekDays(selectedWeek.split("_")[0]) : [];

  const renderAppointmentCell = (dayKey, slotIndex) => {
    const day = weekDays.find((d) => d.key === dayKey);
    const dateKey = day?.fullDate;
    const dayData = scheduleData[dateKey];

    if (!dayData || !dayData.slots) {
      return <div className="ds-empty-slot">-</div>;
    }

    const slot = dayData.slots.find((s) => s.slot_index === slotIndex);

    if (!slot) {
      return <div className="ds-empty-slot">-</div>;
    }

    return (
      <div
        className={`ds-appointment-cell ${slot.isAvailable ? "" : "ds-active"}`}
      >
        <div className="ds-appointment-info">
          <div className="ds-appointment-time">
            {slot.start_time}-{slot.end_time}
          </div>
          <div className="ds-appointment-status">({slot.status})</div>
          <div className="ds-appointment-availability">
            {slot.isAvailable ? "Trống" : "Đã đặt"}
          </div>
        </div>
        {!slot.isAvailable && (
          <div className="ds-appointment-actions">
            <button
              className="ds-detail-button"
              onClick={() => fetchAppointmentDetails(slot._id)}
              title="Xem chi tiết"
            >
              <Visibility fontSize="small" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setAppointmentDetails(null);
  };

  return (
    <div className="ds-schedule-page">
      <div className="ds-schedule-header">
        <h2 className="ds-schedule-title">Xem lịch làm việc của bác sĩ</h2>
      </div>

      <div className="ds-selector-container">
        <DoctorSelector
          onDoctorChange={setSelectedDoctor}
          onClinicInfoChange={setClinicInfo}
        />
        {clinicInfo && (
          <div className="ds-clinic-info">
            <h3>Thông tin phòng khám</h3>
            <p>
              <strong>Tên phòng khám:</strong> {clinicInfo.name}
            </p>
            <p>
              <strong>Mô tả:</strong> {clinicInfo.description}
            </p>
          </div>
        )}
        <div className="ds-header-controls">
          <div className="ds-selector-group">
            <label>Năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              disabled={!selectedDoctor || years.length === 0}
            >
              <option value="">-- Chọn năm --</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="ds-selector-group">
            <label>Tuần</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              disabled={!selectedYear || weeks.length === 0}
            >
              <option value="">-- Chọn tuần --</option>
              {weeks.map((week) => (
                <option
                  key={`${week.start}_${week.end}`}
                  value={`${week.start}_${week.end}`}
                >
                  {formatWeekRange(week.start, week.end)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedDoctor && selectedWeek && (
        <div className="ds-schedule-container">
          <div className="ds-calendar-grid">
            {loading && <div className="ds-loading">Đang tải...</div>}
            <table className="ds-schedule-table">
              <thead>
                <tr>
                  <th className="ds-slot-header"></th>
                  {weekDays.map((day) => (
                    <th key={day.key} className="ds-day-header">
                      <div className="ds-day-name">{day.label}</div>
                      <div className="ds-day-date">{day.date}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slotIndex) => (
                  <tr key={slotIndex}>
                    <td className="ds-slot-index">Ca {slotIndex}</td>
                    {weekDays.map((day) => (
                      <td
                        key={`${day.key}-${slotIndex}`}
                        className="ds-appointment-slot"
                      >
                        {renderAppointmentCell(day.key, slotIndex)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && appointmentDetails && (
        <div className="ds-modal-overlay">
          <div className="ds-modal-content">
            <div className="ds-modal-header">
              <h3>Chi tiết cuộc hẹn</h3>
              <button className="ds-modal-close-icon" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-modal-section">
                <h4>Thông tin bệnh nhân</h4>
                <p>
                  <strong>Họ tên:</strong>{" "}
                  {appointmentDetails.patientId?.userId?.fullname ||
                    "Không xác định"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {appointmentDetails.patientId?.userId?.email || "Không có"}
                </p>
                <p>
                  <strong>Số điện thoại:</strong>{" "}
                  {appointmentDetails.patientId?.userId?.phone || "Không có"}
                </p>
              </div>
              <div className="ds-modal-section">
                <h4>Thông tin cuộc hẹn</h4>
                <p>
                  <strong>Dịch vụ:</strong>{" "}
                  {appointmentDetails.serviceId?.serviceName ||
                    "Không xác định"}
                </p>
                <p>
                  <strong>Phòng khám:</strong>{" "}
                  {clinicInfo ? clinicInfo.name : "Không xác định"}
                </p>
                <p>
                  <strong>Thời gian:</strong>{" "}
                  {appointmentDetails.timeslotId?.start_time} -{" "}
                  {appointmentDetails.timeslotId?.end_time}
                </p>
                <p>
                  <strong>Ngày:</strong>{" "}
                  {new Date(
                    appointmentDetails.timeslotId?.date
                  ).toLocaleDateString("vi-VN")}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  <span
                    className={`ds-status-${appointmentDetails.status.toLowerCase()}`}
                  >
                    {appointmentDetails.status}
                  </span>
                </p>
                <p>
                  <strong>Ghi chú:</strong>{" "}
                  {appointmentDetails.note || "Không có"}
                </p>
              </div>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-modal-close-button" onClick={closeModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default DoctorScheduleView;
