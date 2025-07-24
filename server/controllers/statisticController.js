const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const ServiceOption = require("../models/ServiceOption");

// Get daily appointment count (dynamic date range)
exports.getAppointmentTrend = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const result = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("getAppointmentTrend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get daily revenue (dynamic date range)
exports.getRevenueTrend = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const result = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "appointments",
          localField: "appointmentId",
          foreignField: "_id",
          as: "appointment",
        },
      },
      { $unwind: "$appointment" },
      {
        $lookup: {
          from: "serviceoptions",
          localField: "appointment.serviceOptionId",
          foreignField: "_id",
          as: "serviceOption",
        },
      },
      { $unwind: "$serviceOption" },
      {
        $addFields: {
          calculatedRevenue: {
            $switch: {
              branches: [
                {
                  case: { $in: ["$appointment.status", ["confirmed", "completed"]] },
                  then: "$amount",
                },
                {
                  case: { $eq: ["$appointment.status", "fully_paid"] },
                  then: {
                    $add: ["$amount", { $multiply: ["$serviceOption.price", 0.7] }],
                  },
                },
              ],
              default: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$calculatedRevenue" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("getRevenueTrend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Appointment status distribution (dynamic date range)
exports.getAppointmentStatusStats = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const result = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("getAppointmentStatusStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Revenue breakdown by payment method (dynamic date range)
exports.getRevenueByMethod = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const result = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "paid",
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("getRevenueByMethod error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Revenue breakdown by payment type (dynamic date range)
exports.getRevenueByType = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const result = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "paid",
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("getRevenueByType error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Summary counts for KPIs (dynamic date range)
exports.getDashboardSummaries = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const appointmentCount = await Appointment.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const revenue = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const completedAppointments = await Appointment.countDocuments({
      status: { $in: ["completed", "fully_paid"] },
      createdAt: { $gte: startDate, $lte: endDate },
    });
    const fullyPaidAppointments = await Appointment.countDocuments({
      status: "fully_paid",
      createdAt: { $gte: startDate, $lte: endDate },
    });

    res.json({
      success: true,
      data: {
        totalAppointments: appointmentCount,
        totalRevenue: revenue[0]?.total || 0,
        completedAppointments,
        fullyPaidAppointments,
      },
    });
  } catch (err) {
    console.error("getDashboardSummaries error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Appointment distribution by clinic (dynamic date range)
exports.getAppointmentByClinic = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const result = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$clinicId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "clinics",
          localField: "_id",
          foreignField: "_id",
          as: "clinic",
        },
      },
      { $unwind: "$clinic" },
      {
        $project: {
          clinicName: "$clinic.name",
          count: 1,
        },
      },
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("getAppointmentByClinic error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Appointment distribution by service (dynamic date range)
exports.getAppointmentByService = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const result = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$serviceId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$service" },
      {
        $project: {
          serviceName: "$service.name",
          count: 1,
        },
      },
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("getAppointmentByService error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all payments with details and statistics
exports.getAllPayments = async (req, res) => {
  try {
    const { start, end } = req.query;
    let dateFilter = {};
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
        return res.status(400).json({ message: "Invalid date range" });
      }
      dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    }

    const payments = await Payment.find(dateFilter)
      .populate({
        path: "metaData.patientId",
        select: "userId",
        populate: {
          path: "userId",
          model: "User",
          select: "fullname",
        },
      })
      .populate({
        path: "metaData.doctorId",
        select: "userId",
        populate: {
          path: "userId",
          model: "User",
          select: "fullname",
        },
      })
      .populate({
        path: "metaData.serviceId",
        select: "serviceName price",
      })
      .populate({
        path: "metaData.clinicId",
        select: "clinic_name",
      })
      .populate({
        path: "appointmentId",
        populate: [
          {
            path: "patientId",
            model: "Patient",
            populate: { path: "userId", model: "User", select: "fullname" },
          },
          {
            path: "doctorId",
            model: "Doctor",
            populate: { path: "userId", model: "User", select: "fullname" },
          },
          { path: "serviceId", model: "Service", select: "serviceName price" },
          { path: "clinicId", model: "Clinic", select: "clinic_name" },
        ],
      })
      .lean();

    const statistics = {
      totalRevenue: 0,
      byStatus: {
        pending: { count: 0, amount: 0 },
        paid: { count: 0, amount: 0 },
        canceled: { count: 0, amount: 0 },
      },
      byType: {
        deposit: { count: 0, amount: 0 },
        final: { count: 0, amount: 0 },
      },
      byPaymentMethod: {
        online: { count: 0, amount: 0 },
        cash: { count: 0, amount: 0 },
      },
      totalCount: payments.length,
    };

    payments.forEach((payment) => {
      statistics.totalRevenue += payment.amount;
      statistics.byStatus[payment.status].count += 1;
      statistics.byStatus[payment.status].amount += payment.amount;
      statistics.byType[payment.type].count += 1;
      statistics.byType[payment.type].amount += payment.amount;
      statistics.byPaymentMethod[payment.paymentMethod].count += 1;
      statistics.byPaymentMethod[payment.paymentMethod].amount += payment.amount;
    });

    const getField = (first, fallback) => first || fallback || "N/A";

    const formattedPayments = payments.map((p) => ({
      _id: p._id,
      amount: p.amount,
      description: p.description,
      orderCode: p.orderCode,
      status: p.status,
      type: p.type,
      paymentMethod: p.paymentMethod,
      payUrl: p.payUrl,
      qrCode: p.qrCode,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      metaData: {
        patient: getField(
          p.metaData.patientId?.userId?.fullname,
          p.appointmentId?.patientId?.userId?.fullname
        ),
        doctor: getField(
          p.metaData.doctorId?.userId?.fullname,
          p.appointmentId?.doctorId?.userId?.fullname
        ),
        service: getField(
          p.metaData.serviceId?.serviceName,
          p.appointmentId?.serviceId?.serviceName
        ),
        servicePrice: getField(
          p.metaData.serviceId?.price,
          p.appointmentId?.serviceId?.price
        ) || 0,
        clinic: getField(
          p.metaData.clinicId?.clinic_name,
          p.appointmentId?.clinicId?.clinic_name
        ),
        note: p.metaData.note || "N/A",
        file: p.metaData.fileUrl
          ? {
              url: p.metaData.fileUrl,
              name: p.metaData.fileName,
              type: p.metaData.fileType,
            }
          : null,
      },
      appointmentStatus: p.appointmentId?.status || undefined,
    }));

    res.json({
      success: true,
      data: {
        payments: formattedPayments,
        statistics,
      },
    });
  } catch (err) {
    console.error("getAllPayments error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while getting payments",
      error: err.message,
    });
  }
};