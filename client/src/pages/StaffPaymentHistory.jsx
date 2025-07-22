import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Download,
  Eye,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import "../assets/css/PaymentHistory.css";

const StaffPaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("desc");
  const itemsPerPage = 10;

  // Fetch payment history từ API
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "http://localhost:9999/api/staff/payments",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        console.log("Dữ liệu API:", data);
        if (response.ok && Array.isArray(data.payments)) {
          setPayments(data.payments);
          setFilteredPayments(data.payments);
          setError(null);
        } else {
          setError(data.message || "Không thể tải danh sách giao dịch.");
        }
      } catch (error) {
        console.error("Lỗi khi lấy giao dịch:", error);
        setError("Lỗi kết nối server. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Lọc và sắp xếp giao dịch
  useEffect(() => {
    let filtered = [...payments];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((payment) => {
        const description = payment.description?.toLowerCase() || "";
        const orderCode = payment.orderCode?.toString() || "";
        const doctorName =
          payment.metaData?.doctorId?.userId?.fullname?.toLowerCase() || "";
        const patientName =
          payment.metaData?.patientId?.userId?.fullname?.toLowerCase() || "";
        const searchLower = searchTerm.toLowerCase();
        return (
          description.includes(searchLower) ||
          orderCode.includes(searchLower) ||
          doctorName.includes(searchLower) ||
          patientName.includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case "7days":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          break;
        default:
          break;
      }

      filtered = filtered.filter(
        (payment) => new Date(payment.createdAt) >= filterDate
      );
    }

    // Sort by createdAt
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [payments, searchTerm, statusFilter, dateRange, sortOrder]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  // Logic phân trang
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const getPageNumbers = () => {
    const maxButtons = 3; // Reduced for more compact pagination
    const half = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // Định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Lấy biểu tượng trạng thái
  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="ph-status-icon ph-paid" />;
      case "pending":
        return <Clock className="ph-status-icon ph-pending" />;
      case "canceled":
        return <XCircle className="ph-status-icon ph-canceled" />;
      default:
        return <Clock className="ph-status-icon ph-default" />;
    }
  };

  // Lấy văn bản trạng thái
  const getStatusText = (status) => {
    switch (status) {
      case "paid":
        return "Đã thanh toán";
      case "pending":
        return "Chờ thanh toán";
      case "canceled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  // Lấy biểu tượng phương thức thanh toán
  const getPaymentMethodIcon = (method) => {
    return method === "online" ? (
      <CreditCard className="ph-payment-icon" />
    ) : (
      <Banknote className="ph-payment-icon" />
    );
  };

  return (
    <div className="ph-container">
      <div className="ph-header">
        <div className="ph-header-content">
          <div>
            <h1>Quản lý giao dịch</h1>
            <p>Quản lý và theo dõi tất cả giao dịch tại phòng khám</p>
          </div>
        </div>
      </div>

      <div className="ph-main-content">
        {error && (
          <div className="ph-error-message">
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="ph-loading-message">
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        <div className="ph-filters">
          <div className="ph-filter-grid">
            <div className="ph-search-container">
              <Search className="ph-search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mô tả, mã đơn, bác sĩ, bệnh nhân..."
                className="ph-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                className="ph-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="paid">Đã thanh toán</option>
                <option value="pending">Chờ thanh toán</option>
                <option value="canceled">Đã hủy</option>
              </select>
            </div>

            <div>
              <select
                className="ph-filter-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">Tất cả thời gian</option>
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
                <option value="3months">3 tháng qua</option>
              </select>
            </div>

            <div>
              <button
                onClick={toggleSortOrder}
                className="ph-sort-button"
                title="Sắp xếp theo thời gian"
              >
                <ArrowUpDown size={20} />
                {sortOrder === "desc" ? "Mới nhất" : "Cũ nhất"}
              </button>
            </div>
          </div>
        </div>

        <div className="ph-summary-cards">
          <div className="ph-summary-card ph-paid">
            <h3>Tổng đã thanh toán</h3>
            <p className="ph-amount">
              {formatCurrency(
                filteredPayments
                  .filter((p) => p.status === "paid")
                  .reduce((sum, p) => sum + (p.amount || 0), 0)
              )}
            </p>
          </div>
          <div className="ph-summary-card ph-pending">
            <h3>Chờ thanh toán</h3>
            <p className="ph-amount">
              {formatCurrency(
                filteredPayments
                  .filter((p) => p.status === "pending")
                  .reduce((sum, p) => sum + (p.amount || 0), 0)
              )}
            </p>
          </div>
          <div className="ph-summary-card ph-total">
            <h3>Tổng giao dịch</h3>
            <p className="ph-amount">{filteredPayments.length}</p>
          </div>
        </div>

        <div className="ph-payment-list">
          <div className="ph-payment-list-header">
            <h2>Danh sách giao dịch</h2>
          </div>

          {filteredPayments.length === 0 && !loading ? (
            <div className="ph-empty-state">
              <div className="ph-empty-icon">
                <CreditCard className="ph-icon-large" />
              </div>
              <h3>Không tìm thấy giao dịch</h3>
              <p>Thử thay đổi bộ lọc để xem thêm kết quả</p>
            </div>
          ) : (
            <>
              <div className="ph-table-container">
                <table className="ph-payment-table">
                  <thead>
                    <tr>
                      <th>Bệnh nhân</th>
                      <th>Giao dịch</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPayments.map((payment) => (
                      <tr key={payment._id} className="ph-payment-row">
                        <td>
                          <div className="ph-subtext">
                            {payment.metaData?.patientId?.userId?.fullname ||
                              "N/A"}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="ph-description">
                              {payment.description || "N/A"}
                            </div>
                            <div className="ph-subtext">
                              Mã: #{payment.orderCode || "N/A"}
                            </div>
                            <div className="ph-subtext">
                              BS:{" "}
                              {payment.metaData?.doctorId?.userId?.fullname ||
                                "N/A"}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="ph-amount">
                            {formatCurrency(payment.amount)}
                          </div>
                          <div className="ph-payment-method">
                            {getPaymentMethodIcon(
                              payment.paymentMethod || "online"
                            )}
                            <span className="ph-method-text">
                              {payment.paymentMethod === "online"
                                ? "Online"
                                : "Tiền mặt"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="ph-status">
                            {getStatusIcon(payment.status)}
                            <span className="ph-status-text">
                              {getStatusText(payment.status)}
                            </span>
                          </div>
                        </td>
                        <td className="ph-date">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="ph-detail-button"
                            title="Xem chi tiết"
                          >
                            <Eye size={24} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="ds-pagination">
                  <button
                    className={`ds-pagination-button ${
                      currentPage === 1 ? "ds-pagination-button-disabled" : ""
                    }`}
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    title="Trang trước"
                  >
                    &lsaquo;
                  </button>
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      className={`ds-pagination-button ${
                        currentPage === page
                          ? "ds-pagination-button-active"
                          : ""
                      }`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className={`ds-pagination-button ${
                      currentPage === totalPages
                        ? "ds-pagination-button-disabled"
                        : ""
                    }`}
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    title="Trang sau"
                  >
                    &rsaquo;
                  </button>
                  <span className="ds-pagination-info">
                    Trang {currentPage} / {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedPayment && (
        <div className="ph-modal-overlay">
          <div className="ph-modal">
            <div className="ph-modal-header">
              <h2>Chi tiết giao dịch</h2>
              <button
                onClick={() => setSelectedPayment(null)}
                className="ds-modal-close-icon"
              >
                ×
              </button>
            </div>

            <div className="ph-modal-content">
              <div className="ph-modal-grid">
                <div>
                  <label className="ph-modal-label">Mã giao dịch</label>
                  <p className="ph-modal-value">
                    #{selectedPayment.orderCode || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="ph-modal-label">Số tiền</label>
                  <p className="ph-modal-value">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
              </div>

              <div>
                <label className="ph-modal-label">Bệnh nhân</label>
                <p className="ph-modal-text">
                  {selectedPayment.metaData?.patientId?.userId?.fullname ||
                    "N/A"}
                </p>
              </div>

              <div>
                <label className="ph-modal-label">Mô tả dịch vụ</label>
                <p className="ph-modal-text">
                  {selectedPayment.description || "N/A"}
                </p>
              </div>

              <div className="ph-modal-grid">
                <div>
                  <label className="ph-modal-label">Trạng thái</label>
                  <div className="ph-status">
                    {getStatusIcon(selectedPayment.status)}
                    <span className="ph-modal-status-text">
                      {getStatusText(selectedPayment.status)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="ph-modal-label">
                    Phương thức thanh toán
                  </label>
                  <div className="ph-payment-method">
                    {getPaymentMethodIcon(
                      selectedPayment.paymentMethod || "online"
                    )}
                    <span className="ph-method-text">
                      {selectedPayment.paymentMethod === "online"
                        ? "Online"
                        : "Tiền mặt"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="ph-modal-label">Bác sĩ điều trị</label>
                <p className="ph-modal-text">
                  {selectedPayment.metaData?.doctorId?.userId?.fullname ||
                    "N/A"}
                </p>
              </div>

              {selectedPayment.metaData?.note && (
                <div>
                  <label className="ph-modal-label">Ghi chú</label>
                  <p className="ph-modal-text">
                    {selectedPayment.metaData.note}
                  </p>
                </div>
              )}

              <div className="ph-modal-grid">
                <div>
                  <label className="ph-modal-label">Ngày tạo</label>
                  <p className="ph-modal-text">
                    {formatDate(selectedPayment.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="ph-modal-label">Cập nhật lần cuối</label>
                  <p className="ph-modal-text">
                    {formatDate(selectedPayment.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="ph-modal-footer">
              <button
                onClick={() => setSelectedPayment(null)}
                className="ds-modal-close-button"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPaymentHistory;
