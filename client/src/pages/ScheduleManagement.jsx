import React, { useState, useEffect } from 'react';
import '../assets/css/DoctorSchedulePage.css';
import axios from 'axios';


// Component Date Range Picker đơn giản
const DateRangePicker = ({ onDatesChange }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const generateDateRange = (start, end) => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
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
    <div className="date-range-picker">
      <div className="date-inputs">
        <div className="date-input-group">
          <label>Từ ngày:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="date-input-group">
          <label>Đến ngày:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-input"
            min={startDate || new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {startDate && endDate && (
        <div className="date-preview">
          <strong>Sẽ tạo lịch cho {generateDateRange(startDate, endDate).length} ngày</strong>
          <br />
          <small>Từ {new Date(startDate).toLocaleDateString('vi-VN')} đến {new Date(endDate).toLocaleDateString('vi-VN')}</small>
        </div>
      )}
    </div>
  );
};

// Component Dropdown cho slots
const SlotDropdown = ({ selectedSlots, onSlotsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultSlots = [
    { slot_index: 1, start_time: "08:00", end_time: "09:00", label: "Slot 1 (8:00-9:00)" },
    { slot_index: 2, start_time: "09:00", end_time: "10:00", label: "Slot 2 (9:00-10:00)" },
    { slot_index: 3, start_time: "10:00", end_time: "11:00", label: "Slot 3 (10:00-11:00)" },
    { slot_index: 4, start_time: "14:00", end_time: "15:00", label: "Slot 4 (14:00-15:00)" },
    { slot_index: 5, start_time: "15:00", end_time: "16:00", label: "Slot 5 (15:00-16:00)" },
    { slot_index: 6, start_time: "16:00", end_time: "17:00", label: "Slot 6 (16:00-17:00)" },
    { slot_index: 7, start_time: "17:00", end_time: "18:00", label: "Slot 7 (17:00-18:00)" },
    { slot_index: 8, start_time: "18:00", end_time: "19:00", label: "Slot 8 (18:00-19:00)" },
    { slot_index: 9, start_time: "19:00", end_time: "20:00", label: "Slot 9 (19:00-20:00)" }
  ];

  const handleSlotToggle = (slotIndex) => {
    const newSelection = selectedSlots.includes(slotIndex)
      ? selectedSlots.filter(s => s !== slotIndex)
      : [...selectedSlots, slotIndex];
    onSlotsChange(newSelection);
  };

  const getDisplayText = () => {
    if (selectedSlots.length === 0) return "Chọn khung giờ làm việc";
    if (selectedSlots.length === 1) return `Đã chọn ${selectedSlots.length} slot`;
    return `Đã chọn ${selectedSlots.length} slots`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = event.target.closest('.dropdown-container');
      if (!dropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="dropdown-container">
      <button
        type="button"
        className="dropdown-button"
        onClick={handleButtonClick}
      >
        <span>{getDisplayText()}</span>
        <span className={`dropdown-icon ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-content">
            <div className="slots-grid">
              {defaultSlots.map(slot => (
                <label
                  key={slot.slot_index}
                  className={`slot-item ${selectedSlots.includes(slot.slot_index) ? 'checked' : ''}`}
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

// Component tạo lịch
const CreateScheduleComponent = ({ onScheduleCreated, isVisible }) => {
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCreateSchedule = async () => {
    if (!selectedSlots.length || !selectedDates.length) {
      alert('Vui lòng chọn slot và ngày!');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:9999/api/doctor/create-schedule", // Giữ nguyên "dotor" theo route backend
        {
          selected_slots: selectedSlots,
          dates: selectedDates
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        alert(response.data.message);
        setSelectedSlots([]);
        setSelectedDates([]);
        onScheduleCreated();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`form-container ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="create-schedule-form">
        <h3 className="form-title"> Create Schedule</h3>

        <div style={{ marginBottom: '20px' }}>
          <h4 className="section-title">Chose the slots:</h4>
          <SlotDropdown
            selectedSlots={selectedSlots}
            onSlotsChange={setSelectedSlots}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 className="section-title">Chose the date range:</h4>
          <DateRangePicker onDatesChange={setSelectedDates} />
          <small className="help-text">Chose the date range.</small>
        </div>

        {selectedSlots.length > 0 && selectedDates.length > 0 && (
          <div className="summary">
            <strong> Tóm tắt lịch tạo:</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              Sẽ tạo: <strong>{selectedSlots.length}</strong> slot × <strong>{selectedDates.length}</strong> ngày = <strong style={{ color: '#4a90e2' }}>{selectedSlots.length * selectedDates.length}</strong> slot
            </p>
          </div>
        )}

        <button
          className="submit-button"
          onClick={handleCreateSchedule}
          disabled={loading || !selectedSlots.length || !selectedDates.length}
        >
          {loading ? ' Creating...' : ' Create Schedule'}
        </button>
      </div>
    </div>
  );
};

// Component chính - ĐÃ SỬA
const ScheduleManagement = () => {
  const [currentYear, setCurrentYear] = useState(2025);

  // Tính tuần hiện tại tự động
  const getCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...

    // Tính thứ 2 của tuần hiện tại
    const monday = new Date(today);
    const daysUntilMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + daysUntilMonday);

    // Tính chủ nhật của tuần hiện tại
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const slots = Array.from({ length: 9 }, (_, i) => i + 1);

  const getWeekDays = (startDate) => {
    const days = [];
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const start = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);

      const dayName = dayNames[currentDate.getDay()];
      const dateStr = String(currentDate.getDate()).padStart(2, '0') + '/' +
        String(currentDate.getMonth() + 1).padStart(2, '0');

      days.push({
        key: dayName,
        label: dayName,
        date: dateStr,
        fullDate: currentDate.toISOString().split('T')[0]
      });
    }

    return days;
  };

  const weekDays = getWeekDays(currentWeek.start);

  const formatWeekRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startStr = String(startDate.getDate()).padStart(2, '0') + '/' +
      String(startDate.getMonth() + 1).padStart(2, '0');
    const endStr = String(endDate.getDate()).padStart(2, '0') + '/' +
      String(endDate.getMonth() + 1).padStart(2, '0');

    return `${startStr} To ${endStr}`;
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

      console.log('API Response:', response.data);

      if (response.data.success) {
        const groupedData = {};
        response.data.data.forEach(slot => {
          const dateKey = slot.date.split('T')[0];
          if (!groupedData[dateKey]) {
            groupedData[dateKey] = { slots: [] };
          }
          groupedData[dateKey].slots.push(slot);
        });

        console.log('Grouped data:', groupedData);
        setScheduleData(groupedData);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchScheduleData();
  }, [currentWeek]); // Fetch lại khi currentWeek thay đổi

  // SỬA HÀM NAVIGATE WEEK
  const navigateWeek = (direction) => {
    const startDate = new Date(currentWeek.start);
    const days = direction === 'next' ? 7 : -7;
    startDate.setDate(startDate.getDate() + days);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const newWeek = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };

    console.log('Navigating to week:', newWeek); // Debug
    setCurrentWeek(newWeek);
  };

  const renderAppointmentCell = (dayKey, slotIndex) => {
    const day = weekDays.find(d => d.key === dayKey);
    const dateKey = day?.fullDate;
    const dayData = scheduleData[dateKey];



    if (!dayData || !dayData.slots) {
      return <div className="empty-slot">-</div>;
    }

    const slot = dayData.slots.find(s => s.slot_index === slotIndex);

    if (!slot) {
      return <div className="empty-slot">-</div>;
    }

    return (
      <div className={`appointment-cell ${slot.status}`}>
        <div className="appointment-time">
          {slot.start_time}-{slot.end_time}
        </div>
        <div className="appointment-status">
          ({slot.status})
        </div>
        <div style={{ fontSize: '9px', color: '#666' }}>
          {slot.isAvailable ? 'book' : ' booked'}
        </div>
      </div>
    );
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h2 className="schedule-title">Schedule Management For Doctor</h2>

        <button
          className="create-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : ' Create Schedule'}
        </button>
      </div>

      <CreateScheduleComponent
        onScheduleCreated={() => {
          fetchScheduleData();
          setShowCreateForm(false);
        }}
        isVisible={showCreateForm}
      />

      <div className="schedule-container">
        <div className="schedule-header-bar">
          <div className="header-controls">
            <div className="selector-group">
              <label>YEAR</label>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>


            <div className="selector-group">
              <label>WEEK</label>
              <select
                value={formatWeekRange(currentWeek.start, currentWeek.end)}
                onChange={() => { }} // Thêm onChange handler rỗng
              >
                <option value={formatWeekRange(currentWeek.start, currentWeek.end)}>
                  {formatWeekRange(currentWeek.start, currentWeek.end)}
                </option>
              </select>
            </div>

            <div className="week-navigation">
              <button onClick={() => navigateWeek('prev')}>‹</button>
              <button onClick={() => navigateWeek('next')}>›</button>
            </div>
          </div>
        </div>

        <div className="calendar-grid">
          {loading && <div className="loading">Đang tải...</div>}

          <table className="schedule-table">
            <thead>
              <tr>
                <th className="slot-header"></th>
                {weekDays.map(day => (
                  <th key={day.key} className="day-header">
                    <div className="day-name">{day.label}</div>
                    <div className="day-date">{day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {slots.map(slotIndex => (
                <tr key={slotIndex}>
                  <td className="slot-index">Slot {slotIndex}</td>
                  {weekDays.map(day => (
                    <td key={`${day.key}-${slotIndex}`} className="appointment-slot">
                      {renderAppointmentCell(day.key, slotIndex)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagement;
