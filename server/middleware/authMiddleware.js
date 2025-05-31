const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config();

const authMiddleware = (req, res, next) => {
  // Extract token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ msg: 'Không có token được cung cấp' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach userId and role to req
    next();
  } catch (err) {
    console.error('Xác minh token thất bại:', err);
    res.status(401).json({ msg: 'Token không hợp lệ' });
  }
};
const authAdminMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Không tìm thấy token hoặc token không hợp lệ",
      status: "ERROR",
    });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
        status: "ERROR",
      });
    }
   
    if (decoded.role === "admin") {
      
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập (chỉ dành cho ADMIN)",
        status: "ERROR",
      });
    }
  });
};
const authDentistMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Không tìm thấy token hoặc token không hợp lệ",
      status: "ERROR",
    });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
        status: "ERROR",
      });
    }
    if (decoded.role === "DENTIST") {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập (chỉ dành cho DENTIST)",
        status: "ERROR",
      });
    }
  });
};
const authPatientMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Không tìm thấy token hoặc token không hợp lệ",
      status: "ERROR",
    });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
        status: "ERROR",
      });
    }
    if (decoded.role === "patient") {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập (chỉ dành cho PATIENT)",
        status: "ERROR",
      });
    }
  });
};
const authStaffMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Không tìm thấy token hoặc token không hợp lệ",
      status: "ERROR",
    });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
        status: "ERROR",
      });
    }
    if (decoded.role === "staff") {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập (chỉ dành cho STAFF)",
        status: "ERROR",
      });
    }
  });
};

module.exports = { authMiddleware, authAdminMiddleware, authDentistMiddleware, authPatientMiddleware, authStaffMiddleware }; 