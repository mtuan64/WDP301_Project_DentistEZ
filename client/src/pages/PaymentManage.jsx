import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../assets/css/PaymentManage.css";

const PaymentManage = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    const [summary, setSummary] = useState({
        todayCount: 0,
        monthTotal: 0,
        pendingCount: 0,
        successRate: 0
    });

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');
            const res = await axios.get('http://localhost:9999/api/admin/payments', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page,
                    limit,
                    search,
                    status: statusFilter,
                    method: methodFilter,
                    sortField,
                    sortOrder,
                    t: new Date().getTime()
                }
            });
            console.log('Live paginated payments data from API:', res.data);
            const { data, pagination } = res.data;
            setPayments(data);
            setTotalPages(pagination.totalPages || 1);
        } catch (err) {
            console.error('Error fetching payments:', err);
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllPayments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');
            const res = await axios.get('http://localhost:9999/api/admin/all-payments', {
                headers: { Authorization: `Bearer ${token}` },
                params: { t: new Date().getTime() }
            });
            console.log('Live all payments data from API:', res.data);
            setPayments(res.data);
        } catch (err) {
            console.error('Error fetching all payments:', err);
            setError(err.response?.data?.message || 'Failed to load all payments');
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');
            const res = await axios.get('http://localhost:9999/api/admin/payments/summary', {
                headers: { Authorization: `Bearer ${token}` },
                params: { t: new Date().getTime() }
            });
            console.log('Live summary data from API:', res.data);
            setSummary(res.data);
        } catch (err) {
            console.error('Error fetching summary:', err);
            setError(err.response?.data?.message || 'Failed to load summary');
        }
    };

    useEffect(() => {
        if (showAll) {
            fetchAllPayments();
        } else {
            fetchPayments();
        }
        fetchSummary();
    }, [page, search, statusFilter, methodFilter, sortField, sortOrder, showAll]);

    const handlePrev = () => page > 1 && setPage(page - 1);
    const handleNext = () => page < totalPages && setPage(page + 1);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Payment Management</h1>

            {/* Toggle between Paginated and All Payments */}
            <div className="mb-6">
                <button
                    onClick={() => { setShowAll(false); setPage(1); }}
                    className={`px-4 py-2 mr-2 rounded ${!showAll ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
                >
                    Paginated View
                </button>
                <button
                    onClick={() => { setShowAll(true); setPage(1); }}
                    className={`px-4 py-2 rounded ${showAll ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
                >
                    All Payments View
                </button>
            </div>

            {/* Summary Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">Today's Payments</p>
                    <p className="text-2xl font-bold text-blue-600">{summary.todayCount}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">This Month's Total</p>
                    <p className="text-2xl font-bold text-green-600">
                        {summary.monthTotal.toLocaleString('vi-VN')} VND
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">Pending Payments</p>
                    <p className="text-2xl font-bold text-yellow-600">{summary.pendingCount}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">Success Rate</p>
                    <p className="text-2xl font-bold text-indigo-600">{summary.successRate}%</p>
                </div>
            </div>

            {/* Filters (only for paginated view) */}
            {!showAll && (
                <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 flex-wrap">
                    <div className="flex-1">
                        <label className="block mb-1 font-medium text-gray-700">Search by Service Name</label>
                        <input
                            type="text"
                            placeholder="Enter service name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Method</label>
                        <select
                            value={methodFilter}
                            onChange={(e) => setMethodFilter(e.target.value)}
                            className="border px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All</option>
                            <option value="Cash">Cash</option>
                            <option value="Credit Card">Credit Card</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Sort By</label>
                        <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                            className="border px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="createdAt">Payment Date</option>
                            <option value="amount">Amount</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Order</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="border px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Payment List */}
            {loading ? (
                <p className="text-gray-600 text-center">Loading...</p>
            ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
            ) : payments.length === 0 ? (
                <p className="text-gray-600 text-center">No payment records found.</p>
            ) : (
                <>
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full">
                            <thead className="bg-blue-50 text-sm font-semibold text-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left">#</th>
                                    <th className="px-4 py-3 text-left">Appointment</th>
                                    <th className="px-4 py-3 text-left">Service</th>
                                    <th className="px-4 py-3 text-left">Patient</th>
                                    <th className="px-4 py-3 text-left">Doctor</th>
                                    <th className="px-4 py-3 text-left">Clinic</th>
                                    <th className="px-4 py-3 text-left">Amount</th>
                                    <th className="px-4 py-3 text-left">Method</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-700">
                                {payments.map((p, i) => (
                                    <tr key={p._id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3">{showAll ? i + 1 : (page - 1) * limit + i + 1}</td>
                                        <td className="px-4 py-3">
                                            {(showAll ? p.appointmentId?._id : p.appointment?._id) || 'N/A'} (
                                            {new Date(showAll ? p.appointmentId?.AppointmentDate : p.appointment?.appointmentDate).toLocaleDateString('vi-VN') || 'N/A'})
                                        </td>
                                        <td className="px-4 py-3">{(showAll ? p.appointmentId?.serviceid?.serviceName : p.service?.serviceName) || 'N/A'}</td>
                                        <td className="px-4 py-3">{(showAll ? p.appointmentId?.PatientId?.name : p.patient?.name) || 'N/A'}</td>
                                        <td className="px-4 py-3">{(showAll ? p.appointmentId?.DoctorId?.userId?.name : p.doctor?.user?.name) || 'N/A'}</td>
                                        <td className="px-4 py-3">{(showAll ? p.appointmentId?.clinic_id?.clinic_name : p.clinic?.clinic_name) || 'N/A'}</td>
                                        <td className="px-4 py-3">{p.amount?.toLocaleString('vi-VN') || 'N/A'} VND</td>
                                        <td className="px-4 py-3">{p.method || 'N/A'}</td>
                                        <td
                                            className={`px-4 py-3 font-medium ${
                                                p.status === 'completed'
                                                    ? 'text-green-600'
                                                    : p.status === 'pending'
                                                    ? 'text-yellow-600'
                                                    : 'text-red-600'
                                            }`}
                                        >
                                            {p.status || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {(p.createdAt && new Date(p.createdAt).toLocaleDateString('vi-VN')) || 'N/A'}{' '}
                                            {(p.createdAt && new Date(p.createdAt).toLocaleTimeString('vi-VN')) || ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination (only for paginated view) */}
                    {!showAll && (
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={handlePrev}
                                disabled={page <= 1}
                                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-gray-700">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={handleNext}
                                disabled={page >= totalPages}
                                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PaymentManage;
