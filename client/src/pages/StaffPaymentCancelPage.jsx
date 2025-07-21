import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const StaffPaymentCancelPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/staffmanager/patientapp");
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      minHeight: "65vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <h2 style={{ color: "#e74c3c", marginBottom: 18, fontWeight: 700 }}>Thanh toán đã bị hủy</h2>
      <div style={{ fontSize: 18, marginBottom: 32, color: "#4c6975", textAlign: "center" }}>
        Giao dịch chưa được hoàn tất.<br />
        Đang quay lại trang quản lý lịch...
      </div>
      <button
        onClick={() => navigate("/staffmanager/patientapp")}
        style={{
          background: "#888",
          color: "#fff",
          padding: "12px 34px",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
          boxShadow: "0 2px 8px #aaa2"
        }}
      >
        Về trang Quản lý lịch
      </button>
    </div>
  );
};

export default StaffPaymentCancelPage;
