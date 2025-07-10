const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const moment = require('moment');

// Handle cash payment
exports.paidServices = async (req, res) => {
    try {
        const { appointmentId, serviceId } = req.params;
        const { method } = req.body;

        if (!mongoose.Types.ObjectId.isValid(appointmentId) || !mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment or service ID'
            });
        }

        const appointment = await Appointment.findById(appointmentId);
        const service = await Service.findById(serviceId);

        if (!appointment || !service) {
            return res.status(404).json({
                success: false,
                message: 'Appointment or service not found'
            });
        }

        let payment = await Payment.findOne({ appointmentId, serviceId, status: 'pending' });

        if (!payment) {
            payment = await Payment.create({
                appointmentId,
                serviceId,
                amount: service.price,
                method: method || 'Cash',
                status: 'completed',
                createdAt: new Date()
            });
        } else {
            payment.status = 'completed';
            payment.method = method || 'Cash';
            await payment.save();
        }

        appointment.status = 'completed'; // Assuming payment completion updates appointment status
        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            data: payment
        });
    } catch (error) {
        console.error('Error processing cash payment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get payment summary
exports.getPaymentSummary = async (req, res) => {
    try {
        const todayStart = moment().startOf('day').toDate();
        console.log('Querying payments created after:', todayStart);
        const monthStart = moment().startOf('month').toDate();
        console.log('Querying payments since:', monthStart);

        const [
            todayCount,
            monthTotalAgg,
            pendingCount,
            totalPayments,
            completedPayments
        ] = await Promise.all([
            Payment.countDocuments({ createdAt: { $gte: todayStart } })
                .then(count => { console.log('Live today count:', count); return count; }),
            Payment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: monthStart },
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]).then(result => { console.log('Live month total agg:', result); return result; }),
            Payment.countDocuments({ status: 'pending' })
                .then(count => { console.log('Live pending count:', count); return count; }),
            Payment.countDocuments()
                .then(count => { console.log('Live total payments:', count); return count; }),
            Payment.countDocuments({ status: 'completed' })
                .then(count => { console.log('Live completed payments:', count); return count; })
        ]);

        const monthTotal = monthTotalAgg.length > 0 ? monthTotalAgg[0].total : 0;
        const successRate = totalPayments > 0 ? parseFloat(((completedPayments / totalPayments) * 100).toFixed(1)) : 0;

        console.log('Returning summary:', { todayCount, monthTotal, pendingCount, successRate });
        res.status(200).json({
            todayCount,
            monthTotal,
            pendingCount,
            successRate
        });
    } catch (error) {
        console.error('Error fetching payment summary:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Server error fetching summary',
            error: error.message
        });
    }
};

// Get paginated payments
exports.getPayments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search = '', status, method, sortField = 'createdAt', sortOrder = 'desc' } = req.query;

        const matchConditions = {};
        if (status) matchConditions.status = status;
        if (method) matchConditions.method = method;

        const pipeline = [
            {
                $lookup: {
                    from: 'appointments',
                    localField: 'appointmentId',
                    foreignField: '_id',
                    as: 'appointment'
                }
            },
            { $unwind: '$appointment' },
            {
                $lookup: {
                    from: 'services',
                    localField: 'serviceId',
                    foreignField: '_id',
                    as: 'service'
                }
            },
            { $unwind: '$service' },
            {
                $match: {
                    ...matchConditions,
                    ...(search ? { 'service.name': { $regex: search, $options: 'i' } } : {})
                }
            },
            {
                $sort: {
                    [sortField]: sortOrder === 'asc' ? 1 : -1
                }
            },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    amount: 1,
                    method: 1,
                    status: 1,
                    createdAt: 1,
                    appointment: {
                        _id: 1,
                        appointmentDate: 1
                    },
                    service: {
                        name: 1,
                        price: 1
                    }
                }
            }
        ];

        const countPipeline = [...pipeline];
        countPipeline.push({ $count: 'total' });
        const countResult = await Payment.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        const data = await Payment.aggregate(pipeline);
        console.log('Live payments data:', data);

        res.json({
            data,
            pagination: {
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.getAllPayment = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate({
                path: 'appointmentId',
                populate: [
                    { path: 'PatientId', model: 'Patient', select: 'name' },
                    { path: 'DoctorId', model: 'Doctor', populate: { path: 'userId', model: 'User', select: 'name' } },
                    { path: 'StaffId', model: 'Staff', select: 'name' },
                    { path: 'serviceid', model: 'Service', select: 'serviceName price' },
                    { path: 'clinic_id', model: 'Clinic', select: 'clinic_name' }
                ]
            });

        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};