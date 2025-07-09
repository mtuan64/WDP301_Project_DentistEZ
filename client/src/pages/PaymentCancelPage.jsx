import React from "react";
import { useNavigate } from "react-router-dom";

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <h2 style={{ color: "#e74c3c", marginBottom: 16 }}>Thanh toán đã bị hủy</h2>
      <p style={{ fontSize: 18, marginBottom: 30 }}>
        Bạn chưa hoàn tất thanh toán. Đặt lịch chưa được xác nhận.
      </p>
      <button
        onClick={() => navigate("/services")}
        style={{
          background: "#007bff",
          color: "#fff",
          padding: "12px 30px",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer"
        }}
      >
        Quay lại danh sách dịch vụ
      </button>
    </div>
  );
};

export default PaymentCancelPage;
