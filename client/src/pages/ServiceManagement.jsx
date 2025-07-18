import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../assets/css/ServiceManager.css';

function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [descModal, setDescModal] = useState({ show: false, content: '' });
  const [hovered, setHovered] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allServices, setAllServices] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);







  // Toast/thông báo nổi
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Form add service
  const [form, setForm] = useState({
    serviceName: '',
    doctorId: '',
    clinicId: '',
    description: '',
    image: '',
    options: [{ optionName: '', price: '', image: '' }]
  });
  const [formError, setFormError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchDoctors();
    fetchClinics();
  }, []);

  // Tự động ẩn toast sau 3s
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get('http://localhost:9999/api/admin/viewallservicebymanager', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllServices(res.data.data || res.data);
      setServices(res.data.data || res.data);
    } catch (e) {
      setMessage('Không thể tải danh sách dịch vụ');
    }
    setLoading(false);
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get('http://localhost:9999/api/doctor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(res.data.data || res.data);
    } catch (e) {
      setDoctors([]);
    }
  };

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get('http://localhost:9999/api/clinic', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(res.data.data || res.data);
    } catch (e) {
      setClinics([]);
    }
  };

  // Upload ảnh lên Cloudinary qua backend
  const handleUploadImage = async (e, isOption, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post('http://localhost:9999/api/admin/upload-image', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (isOption) {
        const newOptions = [...form.options];
        newOptions[idx].image = res.data.url;
        setForm({ ...form, options: newOptions });
      } else {
        setForm({ ...form, image: res.data.url });
      }
    } catch (err) {
      alert('Upload ảnh thất bại!');
    }
    setUploading(false);
  };

  // Khi chọn bác sĩ, tự động lấy clinicId và set vào form
const handleDoctorChange = (e) => {
    const selectedDoctorId = e.target.value;
    const doctor = doctors.find(d => d._id === selectedDoctorId);
    let clinicId = '';
    if (doctor && doctor.clinic_id) {
      clinicId = typeof doctor.clinic_id === 'object' ? doctor.clinic_id._id : doctor.clinic_id;
    }
    setForm(prev => ({
      ...prev,
      doctorId: selectedDoctorId,
      clinicId
    }));

    console.log(form);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (idx, e) => {
    const newOptions = [...form.options];
    newOptions[idx][e.target.name] = e.target.value;
    setForm({ ...form, options: newOptions });
  };

  const addOption = () => {
    setForm({ ...form, options: [...form.options, { optionName: '', price: '', image: '' }] });
  };

  const removeOption = (idx) => {
    const newOptions = form.options.filter((_, i) => i !== idx);
    setForm({ ...form, options: newOptions });
  };

  // Validate form trước khi gửi
  const validateForm = () => {
    if (!form.serviceName || !form.doctorId || !form.description || !form.image) {
      setFormError('Vui lòng nhập đầy đủ tên dịch vụ, bác sĩ, mô tả và ảnh dịch vụ!');
      return false;
    }
    if (!form.clinicId) {
      setFormError('Vui lòng chọn bác sĩ!');
      return false;
    }
    if (!Array.isArray(form.options) || form.options.length === 0) {
      setFormError('Phải có ít nhất 1 option dịch vụ nhỏ!');
      return false;

    }
    for (const [idx, opt] of form.options.entries()) {
      if (!opt.optionName || !opt.price || !opt.image) {
        setFormError(`Option nhỏ số ${idx + 1} thiếu tên, giá hoặc ảnh!`);
        return false;
      }
      if (isNaN(Number(opt.price)) || Number(opt.price) <= 0) {
        setFormError(`Giá option nhỏ số ${idx + 1} phải là số dương!`);
        return false;
      }
    }
    setFormError('');
    return true;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setFormError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:9999/api/admin/create/service', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ show: true, message: 'Bạn đã tạo service thành công!', type: 'success' });
      setShowModal(false);
      setFormError('');
      setForm({
        serviceName: '',
        doctorId: '',
        clinicId: '',
        description: '',
        image: '',
        options: [{ optionName: '', price: '', image: '' }]
      });
      fetchServices();
    } catch (err) {
      const message = err.response?.data?.message || 'Có lỗi xảy ra!';
      setFormError(message);
    }
    setLoading(false);
  };

  // Lấy tên phòng khám từ doctorId đã chọn
  const getClinicName = () => {
    const doctor = doctors.find(d => d._id === form.doctorId);
    if (doctor && doctor.clinicId) {
      if (typeof doctor.clinicId === 'object') {
        return doctor.clinicId.clinic_name || doctor.clinicId.name || '';
      } else {
        const clinic = clinics.find(c => c._id === doctor.clinicId);
        return clinic ? (clinic.clinic_name || clinic.name) : '';
      }
    }
    return '';
  };

  // Lọc bác sĩ chưa có dịch vụ
  const availableDoctors = doctors.filter(d =>
    !services.some(sv => sv.doctorId?._id === d._id)
  );


  const tableWrapperStyle = {
    overflowX: 'auto',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    padding: 24,
    marginBottom: 32,
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 16,
    background: '#fff',
  };

  const thStyle = {
    background: '#03a9f4',
    color: '#fff',
    padding: '14px 10px',
    fontWeight: 700,
    textAlign: 'center',
    borderRight: '1px solid #e0e0e0',
  };

  const thLastStyle = {
    ...thStyle,
    borderRight: 'none',
  };

  const tdStyle = {
    padding: '12px 10px',
    textAlign: 'center',
    borderBottom: '1px solid #e0e0e0',
    verticalAlign: 'middle',
    background: '#fff',
  };

  const tdDescStyle = {
    ...tdStyle,
    textAlign: 'left',
    minWidth: 180,
    maxWidth: 320,
    whiteSpace: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 5,
    WebkitBoxOrient: 'vertical',
    color: hovered ? '#007bff' : '#333',
    height: '7em',
  };


  const tdOptionStyle = {
    ...tdStyle,
    textAlign: 'left',
  };

  const imgServiceStyle = {
    width: 60,
    height: 60,
    objectFit: 'cover',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    background: '#fafcff',
  };

  const imgOptionStyle = {
    width: 38,
    height: 38,
    objectFit: 'cover',
    borderRadius: 6,
    border: '1px solid #e0e0e0',
    marginLeft: 8,
    verticalAlign: 'middle',
  };

  const actionBtnStyle = {
    background: '#f5f5f5',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 4px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontSize: 18,
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa dịch vụ này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:9999/api/admin/delete-service/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ show: true, message: 'Đã xóa dịch vụ!', type: 'success' });
      fetchServices();
    } catch (err) {
      setToast({ show: true, message: 'Xóa dịch vụ thất bại!', type: 'error' });
    }
  };
  const handleEdit = (sv) => {
    setForm({
      serviceName: sv.serviceName,
      doctorId: sv.doctorId?._id,
      clinicId: sv.clinicId?._id,
      description: sv.description,
      image: sv.image,
      options: sv.options.map(opt => ({
        _id: opt._id, // rất quan trọng để backend biết option nào là cũ
        optionName: opt.optionName,
        price: opt.price,
        image: opt.image
      }))
    });
    setEditId(sv._id);
    setShowModal(true);
    setFormError('');
  };
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setFormError('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:9999/api/admin/update-service/${editId}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ show: true, message: 'Đã cập nhật dịch vụ!', type: 'success' });
      setShowModal(false);
      setFormError('');
      setEditId(null);
      setForm({
        serviceName: '',
        doctorId: '',
        clinicId: '',
        description: '',
        image: '',
        options: [{ optionName: '', price: '', image: '' }]
      });
      fetchServices();
    } catch (err) {
      const message = err.response?.data?.message || 'Có lỗi xảy ra!';
      setFormError(message);
    }
    setLoading(false);
  };
  const getFilteredServices = () => {
    if (!searchTerm.trim()) return allServices;
    return allServices.filter(sv => {
      // Tên dịch vụ
      const matchService = sv.serviceName?.toLowerCase().includes(searchTerm.toLowerCase());
      // Tên bác sĩ phụ trách
      const matchDoctor = sv.doctorId?.userId?.fullname?.toLowerCase().includes(searchTerm.toLowerCase());
      // Tên phòng khám
      const matchClinic = sv.clinicId?.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchService || matchDoctor || matchClinic;
    });
  };

  const getPaginatedServices = () => {
    const filtered = getFilteredServices();
    const startIdx = (page - 1) * rowsPerPage;
    return filtered.slice(startIdx, startIdx + rowsPerPage);
  };
  const totalFiltered = getFilteredServices().length;
  const totalPages = Math.ceil(totalFiltered / rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, rowsPerPage]);



  const startIdx = (page - 1) * rowsPerPage;



  return (

    <div
      style={{
        maxWidth: 1200,
        margin: '40px auto',
        padding: 32,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)'
      }}

    >


      {/* Toast/thông báo nổi */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: 30,
          right: 30,
          zIndex: 9999,
          padding: '16px 28px',
          borderRadius: 8,
          background: toast.type === 'success' ? '#4caf50' : '#f44336',
          color: '#fff',
          fontWeight: 600,
          fontSize: 18,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Danh sách dịch vụ</h2>
        <button
          style={{
            background: '#03a9f4',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 18px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 16
          }}
          onClick={() => { setShowModal(true); setFormError(''); }}
        >
          + Thêm dịch vụ
        </button>
      </div>
      {/* Hàng 2: Thanh search nằm dưới, căn giữa */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '-10px 0 28px 0' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#f6fafd',
          borderRadius: 30,
          boxShadow: '0 2px 8px rgba(3,169,244,0.07)',
          padding: '6px 12px',
          minWidth: 340,
          maxWidth: 480,
          width: '100%'
        }}>
          <span style={{ marginRight: 8, color: '#03a9f4', fontSize: 20, display: 'flex', alignItems: 'center' }}>
            {/* icon kính lúp */}
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="#03a9f4" strokeWidth="2" /><path stroke="#03a9f4" strokeWidth="2" strokeLinecap="round" d="M20 20l-3.5-3.5" /></svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm dịch vụ, bác sĩ, phòng khám..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 16,
              padding: '8px 4px'
            }}
          />
          {!!searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                marginLeft: 2
              }}
              title="Xóa lọc"
            >
              {/* icon x */}
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="#888" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
      </div>
      {message && <div style={{ margin: '12px 0', color: message.includes('thành công') ? 'green' : 'red' }}>{message}</div>}
      {loading ? (
        <div>Đang tải...</div>
      ) : (

        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>STT</th>
                <th style={thStyle}>Tên dịch vụ</th>
                <th style={thStyle}>Bác sĩ phụ trách</th>
                <th style={thStyle}>Phòng</th>
                <th style={thStyle}>Ảnh</th>
                <th style={thStyle}>Mô tả</th>
                <th style={thStyle}>Option nhỏ</th>
                <th style={thLastStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedServices().length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Không tìm thấy dịch vụ phù hợp!</td>
                </tr>
              )}
              {getPaginatedServices().map((sv, idx, index) => (
                <tr key={sv._id} style={{ background: idx % 2 === 1 ? '#f6fafd' : '#fff' }}>
                  <td style={tdStyle}>{startIdx + idx + 1}</td>
                  <td style={tdStyle}>{sv.serviceName}</td>
                  <td style={tdStyle}>
                    {sv.doctorId?.userId?.fullname ? (
                      <div>
                        <div>{sv.doctorId.userId.fullname}</div>
                        <div style={{
                          fontSize: 13,
                          color: sv.doctorId.Status === ' active ' ? 'red' : 'green',
                          marginTop: 2
                        }}>
                          ({sv.doctorId.Status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'})
                        </div>
                      </div>
                    ) : '---'}
                  </td>
                  <td style={tdStyle}>{sv.clinicId?.clinic_name || '---'}</td>
                  <td style={tdStyle}>
                    {sv.image ? (
                      <img src={sv.image} alt="" style={imgServiceStyle} />
                    ) : '---'}
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={tdDescStyle}
                      onClick={() => setDescModal({ show: true, content: sv.description })}
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => setHovered(false)}
                      title="Click để xem chi tiết"
                    >
                      {sv.description}
                    </div>
                  </td>




                  <td style={tdOptionStyle}>
                    {sv.options && sv.options.length > 0 ? (
                      <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                        {sv.options.map(opt => (
                          <li key={opt._id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                            <span>
                              <b>{opt.optionName}</b> - {Number(opt.price).toLocaleString()}đ
                            </span>
                            {opt.image && (
                              <img src={opt.image} alt={opt.optionName} style={imgOptionStyle} />
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : '---'}
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={actionBtnStyle}
                      title="Sửa"
                      onClick={() => handleEdit(sv)}
                    >
                      {/* icon bút chì */}
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M15.232 5.232a2.5 2.5 0 1 1 3.536 3.536L7.5 20.036 3 21l.964-4.5L15.232 5.232Z" /></svg>
                    </button>
                    <button
                      style={actionBtnStyle}
                      title="Xóa"
                      onClick={() => handleDelete(sv._id)}
                    >
                      {/* icon thùng rác */}
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 7h12M9 7V6a3 3 0 1 1 6 0v1m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages >= 1 && (
            <div className="pagination-container">
              <div className="pagination-list">
                <button
                  className="pagination-btn"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  title="Trang đầu"
                >
                  &#171;
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  title="Trang trước"
                >
                  &#8249;
                </button>
                {/* Hiển thị tối đa 3 số trang: trước, hiện tại, sau */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n =>
                    n === 1 ||
                    n === totalPages ||
                    (n >= page - 1 && n <= page + 1)
                  )
                  .map((n, idx, arr) => (
                    <React.Fragment key={n}>
                      {idx > 0 && n - arr[idx - 1] > 1 && (
                        <span style={{ width: 32, textAlign: 'center', color: '#bdbdbd' }}>...</span>
                      )}
                      <button
                        className={`pagination-btn${page === n ? ' active' : ''}`}
                        onClick={() => setPage(n)}
                        disabled={page === n}
                      >
                        {n}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  className="pagination-btn"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  title="Trang sau"
                >
                  &#8250;
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  title="Trang cuối"
                >
                  &#187;
                </button>
              </div>
            </div>
          )}


        </div>


      )}

      {/* Modal thêm dịch vụ */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 20, boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 900,
            boxShadow: '0 2px 16px rgba(0,0,0,0.12)', position: 'relative', display: 'flex', gap: 24, flexDirection: 'row'
          }}>
            <button onClick={() => { setShowModal(false); setFormError(''); }} style={{
              position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
              fontSize: 24, cursor: 'pointer', color: '#888'
            }}>×</button>

            {/* Cột trái: Thông tin dịch vụ */}
            <form onSubmit={editId ? handleUpdate : handleCreate} style={{ flex: 1, display: 'flex', flexDirection: 'column' }} id="serviceForm">
              <h3 style={{ marginBottom: 16 }}>Thông tin dịch vụ</h3>
              {formError && (
                <div style={{
                  background: '#ffeaea',
                  color: '#e53935',
                  padding: '8px 12px',
                  borderRadius: 6,
                  marginBottom: 12,
                  fontWeight: 500,
                  textAlign: 'center',
                  border: '1px solid #ffcdd2'
                }}>
                  {formError}
                </div>
              )}
              <input
                name="serviceName"
                placeholder="Tên dịch vụ"
                value={form.serviceName}
                onChange={handleFormChange}

                style={{ marginBottom: 12, padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
              />
              <select
                name="doctorId"
                value={form.doctorId}
                onChange={handleDoctorChange}

                style={{ marginBottom: 12, padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
              >
                <option value="">Chọn bác sĩ phụ trách</option>
                {(editId ? doctors : availableDoctors).map(d => (
                  <option key={d._id} value={d._id}>{d.userId?.fullname}</option>
                ))}
              </select>
              <input
                type="text"
                value={getClinicName()}
                readOnly
                placeholder="Phòng khám sẽ tự động hiển thị"
                style={{ marginBottom: 12, padding: 8, borderRadius: 5, border: '1px solid #ccc', background: '#f5f5f5' }}
              />
              <textarea
                name="description"
                placeholder="Mô tả"
                value={form.description}
                onChange={handleFormChange}

                style={{ marginBottom: 12, padding: 8, minHeight: 80, borderRadius: 5, border: '1px solid #ccc' }}
              />
              <label style={{ marginBottom: 6 }}>Ảnh dịch vụ:</label>
              <input type="file" accept="image/*" onChange={e => handleUploadImage(e, false)} style={{ marginBottom: 12 }} />
              {uploading && <span style={{ marginBottom: 12 }}>Đang upload...</span>}
              {form.image && <img src={form.image} alt="preview" width={80} style={{ borderRadius: 6, border: '1px solid #eee', marginBottom: 12 }} />}

              {/* Nút hành động */}
              <div style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                marginTop: 18
              }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#03a9f4',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 18px',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                >
                  {editId ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false); setFormError('');
                    setEditId(null);
                    setForm({
                      serviceName: '',
                      doctorId: '',
                      clinicId: '',
                      description: '',
                      image: '',
                      options: [{ optionName: '', price: '', image: '' }]
                    });
                  }}
                  style={{
                    background: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 18px',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>

            {/* Cột phải: Option nhỏ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: 16 }}>Các lựa chọn dịch vụ nhỏ</h3>
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: 400 }}>
                {form.options.map((opt, idx) => (
                  <div key={idx} style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                    <input
                      name="optionName"
                      placeholder="Tên option"
                      value={opt.optionName}
                      onChange={e => handleOptionChange(idx, e)}
                      required
                      style={{ width: '100%', marginBottom: 8, padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
                    />
                    <input
                      name="price"
                      placeholder="Giá"
                      type="number"
                      value={opt.price}
                      onChange={e => handleOptionChange(idx, e)}
                      required
                      style={{ width: '100%', marginBottom: 8, padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleUploadImage(e, true, idx)}
                      style={{ marginBottom: 8 }}
                    />
                    {opt.image && <img src={opt.image} alt="preview" width={50} style={{ borderRadius: 4, border: '1px solid #eee' }} />}
                    {form.options.length > 1 && (
                      <button type="button" onClick={() => removeOption(idx)} style={{ marginTop: 8, background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>
                        Xóa
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: '#03a9f4', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                + Thêm option nhỏ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* modal detail des */}
      {descModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, padding: 24, minWidth: 300, maxWidth: 500, maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', position: 'relative'
          }}>
            <button
              onClick={() => setDescModal({ show: false, content: '' })}
              style={{
                position: 'absolute', top: 10, right: 14, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888'
              }}
            >×</button>
            <h4 style={{ marginBottom: 16 }}>Mô tả đầy đủ</h4>
            <div style={{ whiteSpace: 'pre-line', fontSize: 16, color: '#333' }}>
              {descModal.content}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ServiceManagement;
