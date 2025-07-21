const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const ServiceOption = require("../models/ServiceOption");

// Get daily appointment count (last 30 days)
exports.getAppointmentTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
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

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get daily revenue (last 30 days)
exports.getRevenueTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: thirtyDaysAgo },
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

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Appointment status distribution (last 30 days)
exports.getAppointmentStatusStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Appointment.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Revenue breakdown by payment method (last 30 days)
exports.getRevenueByMethod = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
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

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Revenue breakdown by payment type (last 30 days)
exports.getRevenueByType = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
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

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Summary counts for KPIs
exports.getDashboardSummaries = async (req, res) => {
  try {
    const appointmentCount = await Appointment.countDocuments();

    const revenue = await Payment.aggregate([
      { $match: { status: "paid" } },
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
                  case: { $in: ["$appointment.status", [ "confirmed", "completed"]] },
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
          _id: null,
          total: { $sum: "$calculatedRevenue" },
        },
      },
    ]);

    const completedAppointments = await Appointment.countDocuments({ status: ["completed", "fully_paid"] });
    const fullyPaidAppointments = await Appointment.countDocuments({ status: "fully_paid" });

    res.json({
      totalAppointments: appointmentCount,
      totalRevenue: revenue[0]?.total || 0,
      completedAppointments,
      fullyPaidAppointments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Appointment distribution by clinic (last 30 days)
exports.getAppointmentByClinic = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Appointment.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
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

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Appointment distribution by service (last 30 days)
exports.getAppointmentByService = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Appointment.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
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

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all payments with details and statistics
exports.getAllPayments = async (req, res) => {
  try {
    // Populate cả metaData và appointmentId (gồm thông tin bệnh nhân, bác sĩ, vv. của lịch hẹn)
    const payments = await Payment.find()
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
            populate: { path: "userId", model: "User", select: "fullname" }
          },
          {
            path: "doctorId",
            model: "Doctor",
            populate: { path: "userId", model: "User", select: "fullname" }
          },
          { path: "serviceId", model: "Service", select: "serviceName price" },
          { path: "clinicId", model: "Clinic", select: "clinic_name" }
        ]
      })
      .lean();

    // Tính toán thống kê như cũ
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

    // Helper lấy thông tin từ metaData hoặc appointmentId
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
        patient:
          getField(
            p.metaData.patientId?.userId?.fullname,
            p.appointmentId?.patientId?.userId?.fullname
          ),
        doctor:
          getField(
            p.metaData.doctorId?.userId?.fullname,
            p.appointmentId?.doctorId?.userId?.fullname
          ),
        service:
          getField(
            p.metaData.serviceId?.serviceName,
            p.appointmentId?.serviceId?.serviceName
          ),
        servicePrice:
          getField(
            p.metaData.serviceId?.price,
            p.appointmentId?.serviceId?.price
          ) || 0,
        clinic:
          getField(
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
      // Để FE biết tình trạng Chung của lịch hẹn (nếu cần)
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

