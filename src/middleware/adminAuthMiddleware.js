// const jwt = require("jsonwebtoken");

// // ===============================
// // PROTECT ROUTE (JWT VERIFY)
// // ===============================
// const protect = (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({
//       success: false,
//       message: "Authorization token missing",
//     });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // attach full user payload
//     req.user = {
//       id: decoded.id,
//       email: decoded.email,
//       role: decoded.role,
//     };

//     next();
//   } catch (err) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired token",
//     });
//   }
// };

// // ===============================
// // ADMIN ONLY
// // ===============================
// const adminOnly = (req, res, next) => {
//   if (!req.user) {
//     return res.status(401).json({
//       success: false,
//       message: "Not authenticated",
//     });
//   }

//   if (req.user.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: admin only",
//     });
//   }

//   next();
// };

// module.exports = { protect, adminOnly };

const jwt = require("jsonwebtoken");

// ===============================
// PROTECT
// ===============================
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id || null,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// ===============================
// ADMIN ONLY
// ===============================
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only access" });
  }

  next();
};

module.exports = { protect, adminOnly };
