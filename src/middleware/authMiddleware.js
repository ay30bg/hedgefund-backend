// const jwt = require("jsonwebtoken");

// exports.protect = (req, res, next) => {
//   try {
//     let token;

//     // Get token from header
//     if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith("Bearer")
//     ) {
//       token = req.headers.authorization.split(" ")[1];
//     }

//     if (!token) {
//       return res.status(401).json({ message: "Not authorized, no token" });
//     }

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = decoded; // attach user to request

//     next();
//   } catch (error) {
//     res.status(401).json({ message: "Token invalid" });
//   }
// };

const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    let token;

    // ================= GET TOKEN =================
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token"
      });
    }

    // ================= VERIFY TOKEN =================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        message: "Invalid token payload"
      });
    }

    // ================= ATTACH USER =================
    req.user = {
      id: decoded.id
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token invalid or expired"
    });
  }
};
