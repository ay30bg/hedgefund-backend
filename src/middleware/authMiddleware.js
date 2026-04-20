// const jwt = require("jsonwebtoken");

// exports.protect = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         message: "Not authorized, no token"
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     if (!decoded?.id) {
//       return res.status(401).json({
//         message: "Invalid token payload"
//       });
//     }

//     req.user = { id: decoded.id };

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       message: "Token invalid or expired"
//     });
//   }
// };

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      req.user = user; // ✅ Available in controllers
      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }
};

// ✅ ADD THIS
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }
  next();
};


module.exports = {
  protect,
  adminOnly, 
};
