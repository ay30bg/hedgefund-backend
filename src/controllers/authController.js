const User = require("../models/User");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");

// // ================= LOGIN =================
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const normalizedEmail = email.toLowerCase().trim();

//     const user = await User.findOne({ email: normalizedEmail });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     if (password !== user.password) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // ✅ CREATE TOKEN
//     const token = jwt.sign(
//       { id: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // ✅ RETURN TOKEN
//     res.json({
//       message: "Login successful",
//       token, // 🔥 THIS WAS MISSING
//       user: {
//         id: user._id,
//         email: user.email
//       }
//     });

//   } catch (error) {
//     console.error("LOGIN ERROR:", error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // TOKEN
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ FIXED RESPONSE (MATCH FRONTEND)
    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        balance: user.balance
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// // ================= SIGNUP =================
// exports.signup = async (req, res) => {
//   try {
//     const { email, password, referralCode } = req.body;

//     // Normalize email
//     const normalizedEmail = email.toLowerCase().trim();

//     // Check if user exists
//     const existingUser = await User.findOne({ email: normalizedEmail });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Create user (PLAIN PASSWORD)
//     const user = await User.create({
//       email: normalizedEmail,
//       password: password,
//       referralCode: referralCode || null
//     });

//     res.status(201).json({
//       message: "Signup successful",
//       user: {
//         id: user._id,
//         email: user.email
//       }
//     });

//   } catch (error) {
//     console.error("SIGNUP ERROR:", error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.signup = async (req, res) => {
  try {
    const { email, password, referralCode } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      referralCode: referralCode || null
    });

    res.status(201).json({
      message: "Signup successful",
      user: {
        _id: user._id.toString(),
        email: user.email
      }
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 10 * 60 * 1000; 

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset</p>
      <p>Click below link to reset password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>This link expires in 10 minutes.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "Password Reset",
      message
    });

    res.json({
      message: "Reset link sent to email"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = password; 
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
