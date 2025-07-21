import React, { useState, useEffect } from "react";
import axios from "axios";
import PaymentModalFinal from "./PaymentModalFinal";
import ReExamModalForStaff from "./ReExamModalForStaff";

const STATUS_TABS = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Fully Paid", value: "fully_paid" },
  { label: "Cancelled", value: "cancelled" },
];

const PAGE_SIZE = 10;

function StaffManagerPatientApp() {
  const [status, setStatus] = useState("confirmed");
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const token = localStorage.getItem("token");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAppointmentId, setPaymentAppointmentId] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [reExamModal, setReExamModal] = useState({ open: false, rootAppointment: null });
  const reloadAppointments = () => setRefresh(r => !r)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let query = `status=${status}&page=${page}&limit=${PAGE_SIZE}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    axios
      .get(
        `http://localhost:9999/app/staff/appointments?${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((resp) => {
        setAppointments(resp.data.data || resp.data);
        setTotal(resp.data.total || resp.data.length);
      })
      .catch(() => {
        setAppointments([]);
        setTotal(0);
      });
  }, [status, token, page, search]);

  const getCount = (tabValue) => (status === tabValue ? total : 0);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const handleTabChange = (tabVal) => {
    setStatus(tabVal);
    setPage(1);
  };

  function handleReExam(apt) {
    setReExamModal({ open: true, rootAppointment: apt });
  }


  // Thanh search giao diện đẹp như mẫu
  const searchBox = (
    <div style={{
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      margin: "22px 0"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        background: "#f7fafd",
        borderRadius: "26px",
        border: "1.5px solid #e8f0fe",
        boxShadow: "0 2px 12px 0 #0088ff13",
        padding: "8px 24px",
        minWidth: 410,
        maxWidth: 540,
        width: "100%"
      }}>
        {/* Icon search svg */}
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" style={{ marginRight: 10 }}
          fill="none" stroke="#12b0ee" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Tìm kiếm tên bệnh nhân, dịch vụ, bác sĩ,..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 18,
            color: "#222",
            padding: 0,
            fontWeight: 400,
            minWidth: 0,
          }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ padding: 0, margin: 0, background: "#fafbfc" }}>
      <h2 style={{ textAlign: "center", margin: "30px 0", fontWeight: 600 }}>
        Quản lý lịch khám của bệnh nhân
      </h2>
      {searchBox}
      <div style={{ display: "flex", borderBottom: "1px solid #f1f1f1", marginBottom: 24 }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            style={{
              flex: 1,
              padding: "18px 0",
              background: status === tab.value ? "#fff" : "#fafbfc",
              color: status === tab.value ? "#232323" : "#969696",
              fontWeight: 500,
              fontSize: 18,
              border: "none",
              borderBottom: status === tab.value ? "2.5px solid #fff" : "2.5px solid transparent",
              borderRadius: status === tab.value ? "12px 12px 0 0" : 0,
              outline: "none",
              cursor: "pointer",
              boxShadow: status === tab.value ? "0 2px 8px #e9e9e9" : "none",
              transition: "background 0.2s, box-shadow 0.2s",
            }}
          >
            {tab.label}{" "}
            <span style={{ color: "#888", fontWeight: 400 }}>
              ({getCount(tab.value)})
            </span>
          </button>
        ))}
      </div>
      <div
        style={{
          overflowX: "auto",
          padding: 0,
          margin: 0,
          background: "#fafbfc",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 1300,
            borderCollapse: "collapse",
            background: "#fff",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>STT</th>
              <th style={thStyle}>Tên Bệnh Nhân</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>SDT</th>
              <th style={thStyle}>Địa Chỉ</th>
              <th style={thStyle}>Tên Dịch Vụ</th>
              <th style={thStyle}>Tên Bác Sĩ</th>
              <th style={thStyle}>Ngày & Giờ Khám</th>
              <th style={thStyle}>Ngày Đặt</th>
              <th style={thStyle}>Ghi Chú</th>
              <th style={thStyle}>Tái khám</th>
              <th style={thStyle}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.map((apt, idx) => {
                // LẤY DỮ LIỆU ĐÚNG THEO AGGREGATION
                const patientUser = apt.patientUser || {};
                const doctorUser = apt.doctorUser || {};
                const service = apt.service || {};
                const serviceOption = apt.serviceOption || {};
                const timeslot = apt.timeslot || {};

                return (
                  <tr key={apt._id}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      {((page - 1) * PAGE_SIZE) + idx + 1}
                    </td>
                    <td style={tdStyle}>{patientUser.fullname || ""}</td>
                    <td style={tdStyle}>{patientUser.email || ""}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle}>{patientUser.phone || ""}</span>
                    </td>
                    <td style={tdStyle}>{patientUser.address || ""}</td>
                    <td style={{
                      ...tdStyle, whiteSpace: 'normal', wordBreak: 'break-word'
                    }}>
                      <div style={{ fontWeight: 600 }}>
                        {service.serviceName || ""}
                      </div>
                      {serviceOption.optionName ? (
                        <div style={{ fontSize: 14, color: '#888', fontWeight: 400 }}>
                          {serviceOption.optionName}
                          {serviceOption.price
                            ? ` - ${Number(serviceOption.price).toLocaleString('vi-VN')}đ`
                            : ''
                          }
                        </div>
                      ) : null}
                    </td>
                    <td style={tdStyle}>{doctorUser.fullname || ""}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      <div style={{ fontWeight: 600 }}>
                        {timeslot.date
                          ? new Date(timeslot.date).toLocaleDateString("vi-VN")
                          : ""}
                      </div>
                      {timeslot.start_time && timeslot.end_time ? (
                        <div style={{ color: "#555", fontSize: 14 }}>
                          ({timeslot.start_time} - {timeslot.end_time})
                        </div>
                      ) : null}
                    </td>
                    <td style={tdStyle}>
                      {apt.createdAt
                        ? new Date(apt.createdAt).toLocaleDateString("vi-VN") +
                        " " +
                        new Date(apt.createdAt).toLocaleTimeString("vi-VN")
                        : ""}
                    </td>
                    <td style={tdStyle}>{apt.note || ""}</td>
                    <td style={tdStyle}>
                      {apt.reExaminationOf
                        ? <span style={{
                          background: "#e2f8e6",
                          color: "#109d42",
                          fontWeight: 500,
                          borderRadius: 7,
                          padding: "4px 16px",
                          fontSize: 15
                        }}>Tái khám</span>
                        : <span style={{ color: "#bbb" }}>—</span>}
                    </td>
                    {/* ACTION */}
                    <td style={tdStyle}>
                      {status === "completed" && (
                        <>
                          <button
                            style={actionBtnStyle}
                            onClick={() => handleReExam(apt)}
                          >
                            Tái khám
                          </button>
                          <button
                            style={{
                              ...actionBtnStyle,
                              background: "#127afc",
                              color: "#fff",
                              marginLeft: 8
                            }}
                            onClick={() => {
                              setPaymentAppointmentId(apt._id);
                              setShowPaymentModal(true);
                            }}
                          >
                            Thanh toán
                          </button>
                        </>
                      )}
                      {status === "fully_paid" && (
                        <button
                          style={actionBtnStyle}
                          onClick={() => handleReExam(apt)}
                        >
                          Tái khám
                        </button>
                      )}
                    </td>
                  </tr>
                );

              })
            ) : (
              <tr>
                <td
                  colSpan={12}
                  style={{
                    ...tdStyle,
                    color: "#8c8c8c",
                    textAlign: "center",
                    background: "#fff"
                  }}
                >
                  No appointments.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {showPaymentModal && (
          <PaymentModalFinal
            open={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            appointmentId={paymentAppointmentId}
            token={token}
            onPaidSuccess={reloadAppointments}
          />
        )}

        {reExamModal.open && (
          <ReExamModalForStaff
            open={reExamModal.open}
            rootAppointment={reExamModal.rootAppointment}
            token={token}
            onClose={() => setReExamModal({ open: false, rootAppointment: null })}
            onSuccess={reloadAppointments}
          />
        )}


        {/* PAGINATION */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            margin: "24px 0"
          }}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              style={paginationBtnStyle}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx + 1}
                onClick={() => setPage(idx + 1)}
                style={{
                  ...paginationBtnStyle,
                  fontWeight: page === idx + 1 ? "bold" : "normal",
                  color: page === idx + 1 ? "#127afc" : "#333",
                  borderBottom: page === idx + 1 ? "2px solid #127afc" : "none"
                }}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              style={paginationBtnStyle}
            >
              &gt;
            </button>
          </div>

        )}
      </div>
    </div>
  );

}

const thStyle = {
  fontWeight: 700,
  color: "#888",
  textAlign: "left",
  padding: "14px 14px",
  background: "#fafbfc",
  border: "1px solid #e2e2e2"
};
const tdStyle = {
  padding: "13px 14px",
  fontSize: 16,
  border: "1px solid #e2e2e2",
  background: "#fff",
  verticalAlign: "top"
};
const badgeStyle = {
  background: "#127afc",
  color: "#fff",
  padding: "6px 18px",
  borderRadius: 18,
  fontWeight: 500,
  fontSize: 15,
  letterSpacing: 1
};
const actionBtnStyle = {
  background: "#e2f8e6",
  color: "#109d42",
  border: "none",
  borderRadius: 8,
  padding: "8px 18px",
  fontWeight: 600,
  fontSize: 15,
  cursor: "pointer",
  marginBottom: 2
};
const paginationBtnStyle = {
  minWidth: 36,
  padding: "6px 12px",
  margin: "0 4px",
  border: "none",
  fontSize: 16,
  borderRadius: 6,
  background: "#f4f6fa",
  cursor: "pointer"
};

export default StaffManagerPatientApp;
