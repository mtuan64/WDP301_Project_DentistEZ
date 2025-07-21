import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PaymentModalFinal({ open, onClose, appointmentId, token, onPaidSuccess }) {
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [paidDeposit, setPaidDeposit] = useState(0); // Số tiền đã cọc!
  const [paymentAmount, setPaymentAmount] = useState(""); // Số tiền thực thu
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [cashGiven, setCashGiven] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  // Load chi tiết lịch + tiền cọc
  useEffect(() => {
    if (open && appointmentId) {
      setLoading(true);
      setMessage(""); setMessageType("info");
      Promise.all([
        axios.get(`http://localhost:9999/app/staffmodal/appointments/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:9999/app/payments/deposit-total/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ])
        .then(([aptRes, depRes]) => {
          setAppointment(aptRes.data);
          setPaidDeposit(depRes.data.totalPaidDeposit || 0);
          const price = aptRes.data.serviceOptionId?.price ?? 0;
          setPaymentAmount(Math.max(price - (depRes.data.totalPaidDeposit || 0), 0));
        })
        .catch(err => {
          setMessage("Không lấy được thông tin lịch hoặc cọc!"); setMessageType("error");
        })
        .finally(() => setLoading(false));
    }
  }, [open, appointmentId, token]);

  // Reset fields khi đóng modal
  useEffect(() => {
    if (!open) {
      setAppointment(null); setCashGiven("");
      setPaymentMethod("online"); setPaymentAmount("");
      setMessage(""); setMessageType("info");
    }
  }, [open]);

  // Tự ẩn message sau 3s nếu là success
  useEffect(() => {
    if (message && messageType === "success") {
      const timer = setTimeout(() => setMessage(""), 2800);
      return () => clearTimeout(timer);
    }
  }, [message, messageType]);

  if (!open) return null;

  const optionPrice = appointment?.serviceOptionId?.price ?? 0;
  const mainServiceName = appointment?.serviceId?.serviceName || "";
  const optionServiceName = appointment?.serviceOptionId?.optionName || "";
  const totalPrice = optionPrice;
  const needToPay = Math.max(optionPrice - paidDeposit, 0);
  // Sửa lại hàm formatMoney (ép về số):
  const formatMoney = n => Number(n).toLocaleString("vi-VN") + "₫";

  // Sửa lại phần tính toán cashReturn:
  const cashReturn =
    paymentMethod === "cash" &&
      cashGiven &&
      !isNaN(Number(cashGiven)) &&
      !isNaN(Number(paymentAmount))
      ? Math.max(Number(cashGiven) - Number(paymentAmount), 0)
      : 0;


  const handlePay = async () => {
    setMessage(""); setMessageType("info");
    if (!paymentAmount || Number(paymentAmount) < 1000) {
      setMessage("Vui lòng nhập số tiền hợp lệ!"); setMessageType("error"); return;
    }
    if (paymentMethod === "cash" && (!cashGiven || Number(cashGiven) < Number(paymentAmount))) {
      setMessage("Tiền khách đưa phải ≥ số tiền cần trả."); setMessageType("error"); return;
    }
    setIsPaying(true);
    try {
      if (paymentMethod === "cash") {
        await axios.post(
          `http://localhost:9999/app/payments/${appointmentId}/final/cash`,
          { amount: paymentAmount, description: "Thanh toán phần còn lại" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage("Đã ghi nhận thanh toán tiền mặt thành công!"); setMessageType("success");
        setTimeout(() => {
          onPaidSuccess && onPaidSuccess();
          setMessage(""); setMessageType("info");
          onClose();
        }, 1400);
      } else {
        const res = await axios.post(
          `http://localhost:9999/app/payments/${appointmentId}/final/online`,
          { amount: paymentAmount, description: "Thanh toán phần còn lại" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage("Đã tạo phiên thanh toán online. Đang mở trang thanh toán..."); setMessageType("success");
        setTimeout(() => {
          window.open(res.data.payment.payUrl, "_blank");
          onPaidSuccess && onPaidSuccess();
          setMessage(""); setMessageType("info");
          onClose();
        }, 1000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Lỗi khi thanh toán");
      setMessageType("error");
      setIsPaying(false);
    }
    setIsPaying(false);
  };

  return (
    <div
      style={{
        position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
        background: "rgba(20, 30, 40, 0.22)", zIndex: 20000,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}
      onClick={() => { if (!isPaying) onClose(); }}
    >
      <div
        style={{
          minWidth: 500,
          maxWidth: 700,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 30px 0 #2159fb12",
          padding: "0px 0px 28px 0px",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          borderRadius: "16px 16px 0 0",
          width: "100%",
          padding: "22px 28px 12px 28px",
          background: "linear-gradient(90deg,#127afc 60%,#12dede 100%)",
          color: "#fff"
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>Thanh toán phần còn lại</div>
          <div style={{ fontSize: 15, marginTop: 4, opacity: 0.96 }}>
            Vui lòng kiểm tra kỹ số tiền cần thanh toán
          </div>
        </div>
        {/* MESSAGE BLOCK */}
        {message && (
          <div
            style={{
              margin: "18px 25px 0 25px",
              padding: "13px 16px",
              borderRadius: 8,
              background: messageType === "error" ? "#ffefef"
                : messageType === "success" ? "#f0fff5"
                  : "#f9fbfd",
              border: messageType === "error" ? "1.3px solid #f80d1c33"
                : messageType === "success" ? "1.3px solid #32db7b44"
                  : "1.1px solid #dde6f2",
              color: messageType === "error" ? "#b91529"
                : messageType === "success" ? "#058e60" : "#2159aa",
              fontWeight: 500,
              fontSize: 15,
              minHeight: 18,
              marginBottom: 3
            }}
          >
            {message}
          </div>
        )}
        <div style={{ padding: 0, margin: 0 }}>

          {loading ? (
            <div style={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#127afc" }}>Đang tải thông tin...</span>
            </div>
          ) : appointment && (
            <div style={{ padding: "4px 24px 4px 24px" }}>
              {/* Dịch vụ và option */}
              <div style={{ margin: "22px 0 18px 0" }}>
                <div style={{ marginBottom: 7, fontWeight: 600, fontSize: 17, color: "#127afc" }}>
                  {mainServiceName}
                </div>
                {optionServiceName && (
                  <div style={{
                    color: "#109d42", background: "#f5f9fa", display: "inline-block",
                    fontWeight: 500, borderRadius: 6, fontSize: 15, padding: "2px 15px"
                  }}>
                    {optionServiceName}
                  </div>
                )}
              </div>
              {/* Thông tin tiền */}
              <div style={{
                border: "1px solid #d3e6fa",
                background: "#f7fcfe",
                borderRadius: 10,
                padding: "18px 20px",
                marginBottom: 18,
                boxShadow: "0 2px 8px #edf4fa"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span>Tổng tiền dịch vụ</span>
                  <span style={{ fontWeight: 700, color: "#d10517" }}>
                    {formatMoney(totalPrice)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span>Đã đặt cọc</span>
                  <span style={{ fontWeight: 700, color: "#f49d00" }}>
                    -{formatMoney(paidDeposit)}
                  </span>
                </div>
                <div style={{ borderTop: "1px dashed #c7e1f5", margin: "8px 0 7px" }}></div>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span style={{ fontWeight: 600 }}>Còn lại phải thanh toán</span>
                  <span style={{
                    fontWeight: 800, color: "#109d42", fontSize: 19, letterSpacing: 1
                  }}>{formatMoney(needToPay)}</span>
                </div>
              </div>
              {/* Input số tiền */}
              <div style={{
                margin: "21px 0 10px 0",
                padding: "13px 0",
                borderRadius: 7,
                background: "#fff",
                border: "1.2px solid #222",
                fontSize: 22,
                fontWeight: 700,
                color: "#222",
                textAlign: "center",
                letterSpacing: 1
              }}>
                <label style={{ fontWeight: 500, display: "block", marginBottom: 5 }}>
                  Số tiền khách cần thanh toán:
                </label>
                {needToPay?.toLocaleString("vi-VN")} <span style={{ fontWeight: 500, fontSize: 17 }}>VND</span>
              </div>


              {/* Loại thanh toán */}
              <div style={{ margin: "19px 0 0 0" }}>
                <label style={{ fontWeight: 500, marginBottom: 5, display: "block" }}>Hình thức thanh toán:</label>
                <div style={{ display: "flex", gap: 24, marginTop: 7 }}>
                  <label>
                    <input
                      type="radio"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      disabled={isPaying}
                    />
                    <span style={{ marginLeft: 7 }}>Online (quét QR)</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                      disabled={isPaying}
                    />
                    <span style={{ marginLeft: 7 }}>Tiền mặt</span>
                  </label>
                </div>
              </div>
              {paymentMethod === "cash" && (
                <div style={{ margin: '19px 0 7px 0' }}>
                  <label style={{ fontWeight: 500, display: "block", marginBottom: 5 }}>
                    Tiền khách đưa (VNĐ):</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    style={{
                      width: "100%",
                      border: "1.2px solid #dde1ea",
                      borderRadius: 7,
                      fontSize: 17,
                      padding: "10px 15px",
                      outline: "none"
                    }}
                    placeholder="Nhập tiền khách đưa"
                    value={cashGiven}
                    onChange={e => setCashGiven(e.target.value)}
                    disabled={isPaying}
                  />
                  {cashGiven && Number(cashGiven) >= Number(paymentAmount) && (
                    <div style={{
                      marginTop: 7, color: "#007642", fontWeight: 600,
                      background: "#f0fff2", borderRadius: 6, padding: "6px 20px"
                    }}>
                      Trả lại khách: {formatMoney(cashReturn)}
                    </div>
                  )}

                </div>
              )}
              {/* Hành động */}
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 13,
                marginTop: 28
              }}>
                <button
                  style={{
                    background: "#eee", color: "#888", borderRadius: 8,
                    minWidth: 70, padding: "11px 26px", border: "none", fontWeight: 600,
                    fontSize: 16, boxShadow: "0 2px 8px #eee"
                  }}
                  onClick={onClose}
                  disabled={isPaying}
                >Huỷ</button>
                <button
                  style={{
                    background: "#127afc", color: "#fff",
                    minWidth: 112, borderRadius: 8, padding: "11px 22px",
                    fontWeight: 700, border: "none", fontSize: 16,
                    boxShadow: "0 2px 10px #14b2ea69",
                    opacity: isPaying ? 0.66 : 1, pointerEvents: isPaying ? "none" : "auto"
                  }}
                  onClick={handlePay}
                  disabled={isPaying}
                >Xác nhận</button>
              </div>
              {isPaying && (
                <div style={{ marginTop: 10, color: "#888", fontStyle: "italic", textAlign: "center" }}>
                  Đang xử lý thanh toán...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
