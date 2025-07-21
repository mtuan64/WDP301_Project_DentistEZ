import React, { useState, useEffect } from "react";
import "../assets/css/DoctorSchedulePage.css";
import axios from "axios";
import { Visibility, Delete, Edit } from "@mui/icons-material";

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

// DateRangePicker Component
const DateRangePicker = ({ onDatesChange }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const generateDateRange = (start, end) => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(new Date(d).toISOString().split("T")[0]);
    }

    return dates;
  };

  useEffect(() => {
    if (startDate && endDate) {
      const dateRange = generateDateRange(startDate, endDate);
      onDatesChange(dateRange);
    } else {
      onDatesChange([]);
    }
  }, [startDate, endDate, onDatesChange]);

  return (
    <div className="ds-date-range-picker">
      <div className="ds-date-inputs">
        <div className="ds-date-input-group">
          <label>Từ ngày:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="ds-date-input"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="ds-date-input-group">
          <label>Đến ngày:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="ds-date-input"
            min={startDate || new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      {startDate && endDate && (
        <div className="ds-date-preview">
          <strong>
            Sẽ tạo lịch cho {generateDateRange(startDate, endDate).length} ngày
          </strong>
          <br />
          <small>
            Từ {new Date(startDate).toLocaleDateString("vi-VN")} đến{" "}
            {new Date(endDate).toLocaleDateString("vi-VN")}
          </small>
        </div>
      )}
    </div>
  );
};

// SlotDropdown Component
const SlotDropdown = ({ selectedSlots, onSlotsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultSlots = [
    {
      slot_index: 1,
      start_time: "08:00",
      end_time: "09:00",
      label: "Slot 1 (8:00-9:00)",
    },
    {
      slot_index: 2,
      start_time: "09:00",
      end_time: "10:00",
      label: "Slot 2 (9:00-10:00)",
    },
    {
      slot_index: 3,
      start_time: "10:00",
      end_time: "11:00",
      label: "Slot 3 (10:00-11:00)",
    },
    {
      slot_index: 4,
      start_time: "14:00",
      end_time: "15:00",
      label: "Slot 4 (14:00-15:00)",
    },
    {
      slot_index: 5,
      start_time: "15:00",
      end_time: "16:00",
      label: "Slot 5 (15:00-16:00)",
    },
    {
      slot_index: 6,
      start_time: "16:00",
      end_time: "17:00",
      label: "Slot 6 (16:00-17:00)",
    },
    {
      slot_index: 7,
      start_time: "17:00",
      end_time: "18:00",
      label: "Slot 7 (17:00-18:00)",
    },
    {
      slot_index: 8,
      start_time: "18:00",
      end_time: "19:00",
      label: "Slot 8 (18:00-19:00)",
    },
    {
      slot_index: 9,
      start_time: "19:00",
      end_time: "20:00",
      label: "Slot 9 (19:00-20:00)",
    },
  ];

  const handleSlotToggle = (slotIndex) => {
    const newSelection = selectedSlots.includes(slotIndex)
      ? selectedSlots.filter((s) => s !== slotIndex)
      : [...selectedSlots, slotIndex];
    onSlotsChange(newSelection);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = event.target.closest(".ds-dropdown-container");
      if (!dropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="ds-dropdown-container">
      <button
        type="button"
        className="ds-dropdown-button"
        onClick={handleButtonClick}
      >
        <span>
          {selectedSlots.length === 0
            ? "Chọn khung giờ làm việc"
            : selectedSlots.length === 1
            ? `Đã chọn ${selectedSlots.length} slot`
            : `Đã chọn ${selectedSlots.length} slots`}
        </span>
        <span className={`ds-dropdown-icon ${isOpen ? "open" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="ds-dropdown-menu">
          <div className="ds-dropdown-content">
            <div className="ds-slots-grid">
              {defaultSlots.map((slot) => (
                <label
                  key={slot.slot_index}
                  className={`ds-slot-item ${
                    selectedSlots.includes(slot.slot_index) ? "ds-checked" : ""
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedSlots.includes(slot.slot_index)}
                    onChange={() => handleSlotToggle(slot.slot_index)}
                  />
                  <span>{slot.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// CreateScheduleComponent
const CreateScheduleComponent = ({ onScheduleCreated, isVisible }) => {
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleCreateSchedule = async () => {
    if (!selectedSlots.length || !selectedDates.length) {
      setNotification({
        message: "Vui lòng chọn slot và ngày!",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:9999/api/doctor/create-schedule",
        {
          selected_slots: selectedSlots,
          dates: selectedDates,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setNotification({
          message: response.data.message,
          type: "success",
        });
        setSelectedSlots([]);
        setSelectedDates([]);
        onScheduleCreated();
      } else {
        setNotification({
          message: response.data.message,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      setNotification({
        message: "Có lỗi xảy ra khi tạo lịch!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`ds-form-container ${
          isVisible ? "ds-visible" : "ds-hidden"
        }`}
      >
        <div className="ds-create-schedule-form">
          <h3 className="ds-form-title">Tạo lịch</h3>

          <div style={{ marginBottom: "20px" }}>
            <h4 className="ds-section-title">Chọn khung giờ:</h4>
            <SlotDropdown
              selectedSlots={selectedSlots}
              onSlotsChange={setSelectedSlots}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 className="ds-section-title">Chọn khoảng ngày:</h4>
            <DateRangePicker onDatesChange={setSelectedDates} />
            <small className="ds-help-text">
              Chọn khoảng ngày để tạo lịch.
            </small>
          </div>

          {selectedSlots.length > 0 && selectedDates.length > 0 && (
            <div className="ds-summary">
              <strong>Tóm tắt lịch tạo:</strong>
              <p style={{ margin: "8px 0 0 0" }}>
                Sẽ tạo: <strong>{selectedSlots.length}</strong> slot ×{" "}
                <strong>{selectedDates.length}</strong> ngày ={" "}
                <strong style={{ color: "#4a90e2" }}>
                  {selectedSlots.length * selectedDates.length}
                </strong>{" "}
                slot
              </p>
            </div>
          )}

          <button
            className="ds-submit-button"
            onClick={handleCreateSchedule}
            disabled={loading || !selectedSlots.length || !selectedDates.length}
          >
            {loading ? "Đang tạo..." : "Tạo lịch"}
          </button>
        </div>
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

// Main ScheduleManagement Component
const ScheduleManagement = () => {
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    const daysUntilMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + daysUntilMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    };
  });
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [timeslotToDelete, setTimeslotToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [editNote, setEditNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] =
    useState(false);

  const slots = Array.from({ length: 9 }, (_, i) => i + 1);

  const getWeekDays = (startDate) => {
    const days = [];
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
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

  const weekDays = getWeekDays(currentWeek.start);

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

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:9999/api/doctor/getScheduleByWeek?startDate=${currentWeek.start}&endDate=${currentWeek.end}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        const groupedData = {};
        response.data.data.forEach((slot) => {
          const dateKey = slot.date.split("T")[0];
          if (!groupedData[dateKey]) {
            groupedData[dateKey] = { slots: [] };
          }
          groupedData[dateKey].slots.push(slot);
        });
        setScheduleData(groupedData);
      } else {
        setNotification({
          message: response.data.message,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setNotification({
        message: "Có lỗi khi tải lịch!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

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
        setNewNote(response.data.data.note || "");
        setShowModal(true);
      } else {
        setNotification({
          message: response.data.message,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching appointment details:", error);
      setNotification({
        message: "Không thể tải thông tin cuộc hẹn!",
        type: "error",
      });
    }
  };

  const deleteTimeslot = async (timeslotId) => {
    try {
      const response = await axios.delete(
        `http://localhost:9999/api/timeslots/${timeslotId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setNotification({
          message: "Xóa timeslot thành công!",
          type: "success",
        });
        await fetchScheduleData();
      } else {
        setNotification({
          message: response.data.message,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting timeslot:", error);
      setNotification({
        message: error.response?.data?.message || "Không thể xóa timeslot!",
        type: "error",
      });
    } finally {
      setShowDeleteModal(false);
      setTimeslotToDelete(null);
    }
  };

  const markAppointmentCompleted = async () => {
    if (!appointmentDetails?._id) return;

    const appointmentDate = new Date(appointmentDetails.timeslotId?.date);
    const currentDate = new Date();
    // Set time to 00:00:00 for date comparison
    appointmentDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (appointmentDate > currentDate) {
      setNotification({
        message: "Không thể hoàn tất cuộc hẹn trong tương lai!",
        type: "error",
      });
      setShowConfirmCompleteModal(false);
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:9999/api/appointments/update-status-note/${appointmentDetails._id}`,
        { status: "completed" },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setAppointmentDetails({ ...appointmentDetails, status: "completed" });
        setNotification({
          message: "Đánh dấu hoàn tất thành công!",
          type: "success",
        });
        setShowConfirmCompleteModal(false);
      } else {
        setNotification({
          message: response.data.message,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error marking appointment as completed:", error);
      setNotification({
        message: "Không thể cập nhật trạng thái!",
        type: "error",
      });
    }
  };

  const updateAppointmentNote = async () => {
    if (!appointmentDetails?._id || !newNote) return;

    try {
      const response = await axios.put(
        `http://localhost:9999/api/appointments/update-status-note/${appointmentDetails._id}`,
        { note: newNote },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setAppointmentDetails({ ...appointmentDetails, note: newNote });
        setEditNote(false);
        setNotification({
          message: "Cập nhật ghi chú thành công!",
          type: "success",
        });
      } else {
        setNotification({
          message: response.data.message,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating appointment note:", error);
      setNotification({
        message: "Không thể cập nhật ghi chú!",
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, [currentWeek]);

  const navigateWeek = (direction) => {
    const startDate = new Date(currentWeek.start);
    const days = direction === "next" ? 7 : -7;
    startDate.setDate(startDate.getDate() + days);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    setCurrentWeek({
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    });
  };

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
        <div className="ds-appointment-actions">
          {slot.isAvailable ? (
            <button
              className="ds-delete-button"
              onClick={() => {
                setTimeslotToDelete(slot._id);
                setShowDeleteModal(true);
              }}
              title="Xóa timeslot"
            >
              <Delete fontSize="small" />
            </button>
          ) : (
            <button
              className="ds-detail-button"
              onClick={() => fetchAppointmentDetails(slot._id)}
              title="Xem chi tiết"
            >
              <Visibility fontSize="small" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setAppointmentDetails(null);
    setEditNote(false);
    setNewNote("");
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTimeslotToDelete(null);
  };

  const closeConfirmCompleteModal = () => {
    setShowConfirmCompleteModal(false);
  };

  return (
    <div className="ds-schedule-page">
      <div className="ds-schedule-header">
        <h2 className="ds-schedule-title">Quản lý lịch hẹn bác sĩ</h2>
        <button
          className="ds-create-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Hủy" : "Tạo lịch mới"}
        </button>
      </div>

      <CreateScheduleComponent
        onScheduleCreated={() => {
          fetchScheduleData();
          setShowCreateForm(false);
        }}
        isVisible={showCreateForm}
      />

      <div className="ds-schedule-container">
        <div className="ds-schedule-header-bar">
          <div className="ds-header-controls">
            <div className="ds-selector-group">
              <label>NĂM</label>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            <div className="ds-selector-group">
              <label>TUẦN</label>
              <select
                value={formatWeekRange(currentWeek.start, currentWeek.end)}
                onChange={() => {}}
              >
                <option
                  value={formatWeekRange(currentWeek.start, currentWeek.end)}
                >
                  {formatWeekRange(currentWeek.start, currentWeek.end)}
                </option>
              </select>
            </div>

            <div className="ds-week-navigation">
              <button onClick={() => navigateWeek("prev")}>‹</button>
              <button onClick={() => navigateWeek("next")}>›</button>
            </div>
          </div>
        </div>

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
                  <td className="ds-slot-index">Slot {slotIndex}</td>
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
                  {appointmentDetails.clinicId?.clinic_name || "Không xác định"}
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
                  <strong>Ghi chú:</strong>
                  {editNote ? (
                    <div className="ds-note-edit-container">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="ds-note-input"
                        rows="4"
                        placeholder="Nhập ghi chú..."
                      />
                      <div className="ds-note-actions">
                        <button
                          className="ds-modal-save-note-button"
                          onClick={updateAppointmentNote}
                        >
                          Lưu
                        </button>
                        <button
                          className="ds-modal-cancel-note-button"
                          onClick={() => {
                            setNewNote(appointmentDetails.note || "");
                            setEditNote(false);
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span>
                      {appointmentDetails.note || "Không có"}
                      <button
                        className="ds-edit-note-button"
                        onClick={() => setEditNote(true)}
                      >
                        <Edit fontSize="small" />
                      </button>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="ds-modal-footer">
              {appointmentDetails.status === "confirmed" &&
                (() => {
                  const appointmentDate = new Date(
                    appointmentDetails.timeslotId?.date
                  );
                  const currentDate = new Date();
                  appointmentDate.setHours(0, 0, 0, 0);
                  currentDate.setHours(0, 0, 0, 0);
                  if (appointmentDate <= currentDate) {
                    return (
                      <button
                        className="ds-modal-confirm-button"
                        onClick={() => setShowConfirmCompleteModal(true)}
                      >
                        Hoàn tất
                      </button>
                    );
                  }
                  return null;
                })()}
              <button className="ds-modal-close-button" onClick={closeModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmCompleteModal && (
        <div className="ds-modal-overlay">
          <div className="ds-modal-content">
            <div className="ds-modal-header">
              <h3>Xác nhận hoàn tất</h3>
              <button
                className="ds-modal-close-icon"
                onClick={closeConfirmCompleteModal}
              >
                ×
              </button>
            </div>
            <div className="ds-modal-body">
              <p>Bạn có chắc chắn đã khám xong cho cuộc hẹn này?</p>
              <p>
                Lưu ý: Hành động này sẽ đánh dấu trạng thái là "Hoàn tất" và
                không thể hoàn tác.
              </p>
            </div>
            <div className="ds-modal-footer">
              <button
                className="ds-modal-close-button"
                onClick={closeConfirmCompleteModal}
              >
                Hủy
              </button>
              <button
                className="ds-modal-confirm-button"
                onClick={markAppointmentCompleted}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="ds-modal-overlay">
          <div className="ds-modal-content">
            <div className="ds-modal-header">
              <h3>Xác nhận xóa timeslot</h3>
              <button
                className="ds-modal-close-icon"
                onClick={closeDeleteModal}
              >
                ×
              </button>
            </div>
            <div className="ds-modal-body">
              <p>Bạn có chắc chắn muốn xóa timeslot này không?</p>
              <p>Lưu ý: Hành động này không thể hoàn tác.</p>
            </div>
            <div className="ds-modal-footer">
              <button
                className="ds-modal-close-button"
                onClick={closeDeleteModal}
              >
                Hủy
              </button>
              <button
                className="ds-modal-confirm-button"
                onClick={() => deleteTimeslot(timeslotToDelete)}
              >
                Xóa
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

export default ScheduleManagement;
