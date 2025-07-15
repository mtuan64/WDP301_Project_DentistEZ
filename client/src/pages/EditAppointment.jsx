import React, { useState, useEffect } from 'react';
import { Modal, Form, DatePicker, Input, Button, message } from 'antd';
import axios from 'axios';
import moment from 'moment';


const EditAppointment = ({ visible, onCancel, appointment, onUpdate }) => {
  const [form] = Form.useForm();
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // Styles similar to ServiceDetail
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
  };

  // Fetch available timeslots, including the current appointment's timeslot
  const fetchAvailableTimeslots = async (selectedDate) => {
    const doctorIdRaw = appointment?.timeslotId?.doctorId;
    const doctorId = typeof doctorIdRaw === 'object' ? doctorIdRaw._id : doctorIdRaw;

    if (!doctorId || !selectedDate) {
      setTimeslots([]);
      return;
    }

    try {
      const response = await axios.get('http://localhost:9999/api/timeslots/available', {
        params: {
          doctorId,
          date: selectedDate.format('YYYY-MM-DD'),
          currentAppointmentId: appointment._id,
        },
      });

      if (response.data.success) {
        const fetchedSlots = response.data.data || [];
        // Filter timeslots by selected date, matching ServiceDetail logic
        const filteredSlots = fetchedSlots.filter(
          (slot) =>
            new Date(slot.date).toISOString().slice(0, 10) ===
            selectedDate.format('YYYY-MM-DD')
        );
        setTimeslots(filteredSlots);
        // Set the initial selected timeslot if it exists in the fetched slots
        const currentSlot = filteredSlots.find((slot) => slot._id === appointment?.timeslotId?._id);
        if (currentSlot) {
          setSelectedTimeSlot(currentSlot);
          form.setFieldsValue({ timeslotId: currentSlot._id });
        } else {
          setSelectedTimeSlot(null);
          form.setFieldsValue({ timeslotId: undefined });
        }
      } else {
        message.error(response.data.message || 'Không lấy được timeslots');
        setTimeslots([]);
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách khung giờ');
      console.error('Error fetching timeslots:', error);
      setTimeslots([]);
    }
  };

  useEffect(() => {
    if (visible && appointment) {
      const apptDate = appointment?.timeslotId?.date
        ? moment(appointment.timeslotId.date)
        : null;
      setSelectedDate(apptDate);

      form.setFieldsValue({
        date: apptDate,
        note: appointment?.note || '',
      });

      if (apptDate) {
        fetchAvailableTimeslots(apptDate);
      }
    }
  }, [visible, appointment, form]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setSelectedTimeSlot(null);
    form.setFieldsValue({ timeslotId: undefined }); // Reset timeslot selection
    if (newDate) {
      fetchAvailableTimeslots(newDate);
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
      const response = await axios.put(`http://localhost:9999/api/appointments/${appointment._id}`, {
        timeslotId: values.timeslotId,
        note: values.note,
      });

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
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
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

        <Form.Item
          name="note"
          label="Ghi chú"
        >
          <Input.TextArea rows={4} placeholder="Nhập ghi chú (nếu có)" />
        </Form.Item>

        <Form.Item>
          <div className="edit-appointment-buttons">
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