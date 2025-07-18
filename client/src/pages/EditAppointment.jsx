import React, { useState, useEffect } from 'react';
import { Modal, Form, DatePicker, Input, Button, message } from 'antd';
import axios from 'axios';
import moment from 'moment';
import '../assets/css/AppointmentPage.css'; // Reuse styles from AppointmentPage

const EditAppointment = ({ visible, onCancel, appointment, onUpdate }) => {
  const [form] = Form.useForm();
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [serviceDetail, setServiceDetail] = useState(null);

  const styles = {
    timeSlots: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      marginTop: '12px',
    },
    timeSlot: {
      padding: '10px 0',
      border: '1.5px solid #ddd',
      borderRadius: '7px',
      textAlign: 'center',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 600,
      background: '#fff',
      transition: 'all 0.2s',
    },
    timeSlotSelected: {
      backgroundColor: '#007bff',
      color: 'white',
      borderColor: '#007bff',
    },
    timeSlotDisabled: {
      backgroundColor: '#f5f5f5',
      color: '#999',
      cursor: 'not-allowed',
    },
    infoSection: {
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
    },
    infoLabel: {
      fontWeight: 600,
      marginRight: '8px',
    },
  };

  // Fetch service details including timeslots
  const fetchServiceDetail = async (serviceId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:9999/api/view-detail/service/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && Array.isArray(response.data.data)) {
        setServiceDetail(response.data.data[0]);
      } else if (response.data && response.data.data) {
        setServiceDetail(response.data.data);
      } else if (response.data && response.data._id) {
        setServiceDetail(response.data);
      } else {
        throw new Error('Dữ liệu chi tiết dịch vụ không hợp lệ');
      }
    } catch (err) {
      message.error(`Không thể tải chi tiết dịch vụ: ${err.message}`);
      setServiceDetail(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available timeslots from serviceDetail
  const fetchAvailableTimeslots = (date) => {
    if (!serviceDetail || !serviceDetail.timeslots) {
      setTimeslots([]);
      return;
    }
    let filteredSlots = serviceDetail.timeslots || [];
    if (date) {
      filteredSlots = filteredSlots.filter((slot) => {
        const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
        const currentTime = new Date();
        const eightHoursInMs = 8 * 60 * 60 * 1000;
        return (
          new Date(slot.date).toISOString().slice(0, 10) === date &&
          (slot.isAvailable !== false || slot._id === appointment?.timeslotId?._id) &&
          slotDateTime - currentTime >= eightHoursInMs
        );
      });
    }
    setTimeslots(filteredSlots);
    const currentSlot = filteredSlots.find((slot) => slot._id === appointment?.timeslotId?._id);
    if (currentSlot) {
      setSelectedTimeSlot(currentSlot);
      form.setFieldsValue({ timeslotId: currentSlot._id });
    } else {
      setSelectedTimeSlot(null);
      form.setFieldsValue({ timeslotId: undefined });
    }
  };

  useEffect(() => {
    if (visible && appointment) {
      const apptDate = appointment?.timeslotId?.date ? moment(appointment.timeslotId.date) : null;
      setSelectedDate(apptDate);
      form.setFieldsValue({
        date: apptDate,
        note: appointment?.note || '',
      });
      if (appointment?.serviceId?._id) {
        fetchServiceDetail(appointment.serviceId._id);
      }
    }
  }, [visible, appointment, form]);

  useEffect(() => {
    if (selectedDate && serviceDetail) {
      fetchAvailableTimeslots(selectedDate.format('YYYY-MM-DD'));
    } else {
      setTimeslots([]);
    }
  }, [selectedDate, serviceDetail]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setSelectedTimeSlot(null);
    form.setFieldsValue({ timeslotId: undefined });
    if (newDate) {
      fetchAvailableTimeslots(newDate.format('YYYY-MM-DD'));
    } else {
      setTimeslots([]);
    }
  };

  const handleTimeSlotSelect = (slot) => {
    if (slot.isAvailable !== false || slot._id === appointment?.timeslotId?._id) {
      setSelectedTimeSlot(slot);
      form.setFieldsValue({ timeslotId: slot._id });
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:9999/api/appointments/${appointment._id}`,
        {
          timeslotId: values.timeslotId,
          note: values.note,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        message.success('Cập nhật lịch hẹn thành công');
        onUpdate(response.data.data);
        onCancel();
      } else {
        message.error(response.data.message || 'Lỗi khi cập nhật lịch hẹn');
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật lịch hẹn');
      console.error('Error updating appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa lịch hẹn"
      open={visible}
      onCancel={onCancel}
      footer={null}
      className="edit-appointment-modal"
    >
      <div style={styles.infoSection}>
        <div>
          <span style={styles.infoLabel}>Dịch vụ:</span>
          {appointment?.serviceId?.serviceName || 'N/A'}
        </div>
        <div>
          <span style={styles.infoLabel}>Bác sĩ:</span>
          {appointment?.doctorId?.userId?.fullname || 'N/A'}
        </div>
        <div>
          <span style={styles.infoLabel}>Phòng khám:</span>
          {appointment?.clinicId?.clinic_name || 'N/A'}
        </div>
      </div>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="date"
          label="Ngày"
          rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            onChange={handleDateChange}
            disabledDate={(current) => current && current < moment().startOf('day')}
            value={selectedDate}
          />
        </Form.Item>
        <Form.Item
          name="timeslotId"
          label="Khung giờ"
          rules={[{ required: true, message: 'Vui lòng chọn khung giờ' }]}
        >
          {!selectedDate ? (
            <span style={{ color: '#888' }}>Vui lòng chọn ngày trước</span>
          ) : timeslots.length > 0 ? (
            <div style={styles.timeSlots}>
              {timeslots.map((slot) => (
                <div
                  key={slot._id}
                  style={{
                    ...styles.timeSlot,
                    ...(selectedTimeSlot?._id === slot._id ? styles.timeSlotSelected : {}),
                    ...(slot.isAvailable === false && slot._id !== appointment?.timeslotId?._id
                      ? styles.timeSlotDisabled
                      : {}),
                  }}
                  onClick={() => handleTimeSlotSelect(slot)}
                >
                  {slot.start_time} - {slot.end_time}
                  {slot.isAvailable === false && slot._id !== appointment?.timeslotId?._id && (
                    <span style={{ color: '#e74c3c', fontSize: 12, marginLeft: 6 }}>
                      (Đã đặt)
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ color: '#888' }}>Không có slot nào</span>
          )}
        </Form.Item>
        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={4} placeholder="Nhập ghi chú (nếu có)" />
        </Form.Item>
        <Form.Item>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              Cập nhật
            </Button>
            <Button onClick={onCancel} disabled={loading}>
              Hủy
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditAppointment;