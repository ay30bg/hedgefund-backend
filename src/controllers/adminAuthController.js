// const jwt = require("jsonwebtoken");

// exports.adminLogin = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Validate input
//     if (!email || !password) {
//       return res.status(400).json({ message: "Email and password are required" });
//     }

//     const adminEmail = process.env.ADMIN_EMAIL;
//     const adminPassword = process.env.ADMIN_PASSWORD;

//     // Check credentials
//     if (email !== adminEmail || password !== adminPassword) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     // Create payload
//     const payload = {
//       email,
//       role: "admin"
//     };

//     // Sign JWT
//     const token = jwt.sign(
//       payload,
//       process.env.JWT_SECRET,
//       {
//         expiresIn: process.env.JWT_EXPIRES_IN || "7d"
//       }
//     );

//     return res.status(200).json({
//       success: true,
//       token,
//       user: {
//         email,
//         role: "admin",
//         name: "Super Admin"
//       }
//     });

//   } catch (err) {
//     console.error("Admin login error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

const jwt = require("jsonwebtoken");

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 🔥 FIXED PAYLOAD (IMPORTANT)
    const payload = {
      id: "admin",           // fixed stable ID
      email,
      role: "admin",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    return res.status(200).json({
      success: true,
      token,
      user: payload,
    });

  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
