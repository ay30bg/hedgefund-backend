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

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // NO DATABASE QUERY (IMPORTANT FIX)
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

module.exports = { protect, adminOnly };
