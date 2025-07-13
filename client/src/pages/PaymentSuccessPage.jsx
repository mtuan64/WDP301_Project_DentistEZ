import React from "react";
import { useNavigate } from "react-router-dom";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <h2 style={{ color: "#27ae60", marginBottom: 16 }}>Thanh toán thành công!</h2>
      <p style={{ fontSize: 18, marginBottom: 30 }}>
        Cảm ơn bạn đã thanh toán. Đơn đặt lịch của bạn sẽ được kiểm tra và xác nhận sớm nhất.
      </p>
      <button
        onClick={() => navigate("/myappointment")}
        style={{
          background: "#27ae60",
          color: "#fff",
          padding: "12px 30px",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer"
        }}
      >
        Xem lịch hẹn của tôi
      </button>
    </div>
  );
};

export default PaymentSuccessPage;
