import React, { useState, useEffect } from 'react';
import { Table, Spin, Button } from 'antd';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EditAppointment from './EditAppointment';
import '../assets/css/PatientAppointment.css';

const PatientAppointment = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [patientInfo, setPatientInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  console.log('UserId from URL:', userId);
  console.log('Current URL:', window.location.href);

  const fetchPatientAndAppointments = async () => {
    setLoading(true);
    try {
      console.log('Fetching patient and appointments for userId:', userId);
      const response = await axios.get(`http://localhost:9999/api/patient/${userId}`);
      console.log('Response:', response.data);
      if (response.data.success) {
        setPatientInfo(response.data.data.patient);
        setAppointments(response.data.data.appointments);
      } else {
        setError(response.data.message || 'Không tìm thấy thông tin bệnh nhân hoặc lịch hẹn');
        if (response.data.message === 'userId không hợp lệ') {
          navigate('/appointment');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Lỗi khi tải thông tin bệnh nhân và lịch hẹn';
      setError(errorMessage);
      if (errorMessage === 'userId không hợp lệ') {
        navigate('/appointment');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientAndAppointments();
  }, [userId, navigate]);

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setEditModalVisible(true);
  };

  const handleUpdateAppointment = (updatedAppointment) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt._id === updatedAppointment._id ? updatedAppointment : appt
      )
    );
  };

  const columns = [
    {
      title: 'STT',
      dataIndex: '_id',
      key: '_id',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Bệnh nhân',
      dataIndex: ['patientId', 'userId', 'fullname'],
      key: 'patient',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Bác sĩ',
      dataIndex: ['doctorId', 'userId', 'fullname'],
      key: 'doctor',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Dịch vụ',
      dataIndex: ['serviceId', 'serviceName'],
      key: 'service',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Phòng khám',
      dataIndex: ['clinicId', 'clinic_name'],
      key: 'clinic',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Ngày',
      dataIndex: ['timeslotId', 'date'],
      key: 'date',
      render: (text) => (text ? new Date(text).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) : 'N/A'),
    },
    {
      title: 'Giờ',
      dataIndex: ['timeslotId', 'start_time'],
      key: 'time',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        const statusMap = {
          confirmed: 'Đã xác nhận',
          cancelled: 'Đã hủy',
          completed: 'Hoàn thành',
          fully_paid: 'Đã thanh toán',
        };
        return statusMap[text] || text;
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (text, record) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          Chỉnh sửa
        </Button>
      ),
    },
  ];

  if (loading) {
    return <div className="patientappointment-loading"><Spin tip="Đang tải..." /></div>;
  }

  if (error) {
    return (
      <div className="patientappointment-error">
        Lỗi: {error}
        <Link to="/appointment" className="btn btn-primary mt-3">
          Quay lại
        </Link>
      </div>
    );
  }

  return (
    <div className="patientappointment-page">
      <div className="patientappointment-wrapper">
        <div className="patientappointment-main">
          <div className="patientappointment-container">
            <div className="patientappointment-card">
              <div className="patientappointment-header">
                <h1 className="patientappointment-title">
                  <EventAvailableIcon fontSize="large" /> Lịch hẹn của bệnh nhân
                </h1>
              </div>
              {patientInfo && (
                <div className="patientappointment-info">
                  <h3>Thông tin bệnh nhân</h3>
                  <p><strong>Họ tên:</strong> {patientInfo.fullname}</p>
                  <p><strong>Email:</strong> {patientInfo.email}</p>
                  <p><strong>Số điện thoại:</strong> {patientInfo.phone || 'N/A'}</p>
                  <p><strong>Địa chỉ:</strong> {patientInfo.address || 'N/A'}</p>
                  <p><strong>Ngày sinh:</strong> {patientInfo.dateOfBirth ? new Date(patientInfo.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}</p>
                  <p><strong>Giới tính:</strong> {patientInfo.gender === 'female' ? 'Nữ' : patientInfo.gender === 'male' ? 'Nam' : patientInfo.gender || 'N/A'}</p>
                </div>
              )}
              <div className="patientappointment-content">
                <Table
                  columns={columns}
                  dataSource={appointments}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: 'Không có lịch hẹn nào' }}
                  className="table-responsive"
                />
                <Link to="/appointment" className="btn btn-primary mt-3">
                  Quay lại
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <EditAppointment
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        appointment={selectedAppointment}
        onUpdate={handleUpdateAppointment}
      />
    </div>
  );
};

export default PatientAppointment;