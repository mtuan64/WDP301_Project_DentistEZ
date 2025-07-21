const Appointment = require("../../models/Appointment");

const getAllAppointmentByStaff = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const pipeline = [];

        // Lọc theo trạng thái
        if (status) pipeline.push({ $match: { status } });

        // populate sâu
        pipeline.push(
            // patient -> user
            { $lookup: {
                from: "patients",
                localField: "patientId",
                foreignField: "_id",
                as: "patient"
            }},
            { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
            { $lookup: {
                from: "users",
                localField: "patient.userId",
                foreignField: "_id",
                as: "patientUser"
            }},
            { $unwind: { path: "$patientUser", preserveNullAndEmptyArrays: true } },
            // doctor -> user
            { $lookup: {
                from: "doctors",
                localField: "doctorId",
                foreignField: "_id",
                as: "doctor"
            }},
            { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
            { $lookup: {
                from: "users",
                localField: "doctor.userId",
                foreignField: "_id",
                as: "doctorUser"
            }},
            { $unwind: { path: "$doctorUser", preserveNullAndEmptyArrays: true } },
            // service
            { $lookup: {
                from: "services",
                localField: "serviceId",
                foreignField: "_id",
                as: "service"
            }},
            { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
            // serviceOption
            { $lookup: {
                from: "serviceoptions",
                localField: "serviceOptionId",
                foreignField: "_id",
                as: "serviceOption"
            }},
            { $unwind: { path: "$serviceOption", preserveNullAndEmptyArrays: true } },
            // timeslot
            { $lookup: {
                from: "timeslots",
                localField: "timeslotId",
                foreignField: "_id",
                as: "timeslot"
            }},
            { $unwind: { path: "$timeslot", preserveNullAndEmptyArrays: true } }
        );

        // Search multi-field & datetime
        if (search && search.trim() !== "") {
            const keyword = search.trim();
            const regex = new RegExp(keyword, "i");
            const orArray = [
                { "patientUser.fullname": regex },
                { "doctorUser.fullname": regex },
                { "service.serviceName": regex },
                { "serviceOption.optionName": regex },
            ];

            // Chấp nhận: 1/7/2025, 19/07/2025, 19-7-2025, 2025-07-19
            const datePattern = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$|^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/;
            const dateMatch = keyword.match(datePattern);
            if (dateMatch) {
                let isoDate = "";
                if (dateMatch[4]) {
                    // yyyy-mm-dd hoặc yyyy/m/d
                    const yyyy = dateMatch[4];
                    const mm = dateMatch[5].padStart(2, "0");
                    const dd = dateMatch[6].padStart(2, "0");
                    isoDate = `${yyyy}-${mm}-${dd}`;
                } else {
                    // dd-mm-yyyy hoặc d/m/yyyy
                    const dd = dateMatch[1].padStart(2, "0");
                    const mm = dateMatch[2].padStart(2, "0");
                    const yyyy = dateMatch[3];
                    isoDate = `${yyyy}-${mm}-${dd}`;
                }
                const dateStart = new Date(isoDate + "T00:00:00.000Z");
                const dateEnd = new Date(isoDate + "T23:59:59.999Z");
                orArray.push({ "timeslot.date": { $gte: dateStart, $lte: dateEnd } });
            }
            pipeline.push({ $match: { $or: orArray } });
        }

        // Đếm tổng số bản ghi
        const pipelineCount = [...pipeline];
        pipeline.push({ $sort: { updatedAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        const [appointments, totalArr] = await Promise.all([
            Appointment.aggregate(pipeline),
            Appointment.aggregate([...pipelineCount, { $count: "count" }])
        ]);
        const total = totalArr[0]?.count || 0;

        res.json({
            data: appointments,
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllAppointmentByStaff,
};
