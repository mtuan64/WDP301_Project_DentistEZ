const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config();

// Danh sách đen để lưu token đã logout (thay bằng Redis trong production)
const tokenBlacklist = [];

// Hàm kiểm tra token trong blacklist
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.includes(token);
};

const authMiddleware = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Không tìm thấy token hoặc token không hợp lệ",
      status: "ERROR",
    });
  }
  
  const token = authHeader.split(' ')[1];

  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    return res.status(401).json({
      message: "Token đã bị thu hồi. Vui lòng đăng nhập lại.",
      status: "ERROR",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId || decoded.id, // hỗ trợ cả khi token có userId hoặc id
      role: decoded.role,
    };
    
    next();
  } catch (err) {
    console.error('Xác minh token thất bại:', err);
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
      status: "ERROR",
    });
  }
};

// Export tokenBlacklist and isTokenBlacklisted for use in logout
exports.tokenBlacklist = tokenBlacklist;
exports.isTokenBlacklisted = isTokenBlacklisted;

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
    if (decoded.role === "doctor") {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập (chỉ dành cho Dotor)",
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
      console.log(decoded);
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

const authDentistOrAdminMiddleware = (req, res, next) => {
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
    if (decoded.role === "doctor" || decoded.role === "admin") {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập (chỉ dành cho Doctor hoặc Admin)",
        status: "ERROR",
      });
    }
  });
};

const authPatientOrStaffMiddleware = (req, res, next) => {
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
    if (decoded.role === "patient" || decoded.role === "staff") {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập (chỉ dành cho Doctor hoặc Admin)",
        status: "ERROR",
      });
    }
  });
};



module.exports = { authMiddleware, authAdminMiddleware, authDentistOrAdminMiddleware, authDentistMiddleware, authPatientMiddleware, authStaffMiddleware, tokenBlacklist, isTokenBlacklisted , authPatientOrStaffMiddleware };