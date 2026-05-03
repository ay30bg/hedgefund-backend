const User = require("../models/User");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");

// ================= SIGNUP (SEND OTP) =================
exports.signup = async (req, res) => {
  try {
    const { email, password, referralCode } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    await User.create({
      email: normalizedEmail,
      password,
      referralCode: referralCode || null,
      otp,
      otpExpire: Date.now() + 10 * 60 * 1000,
      isVerified: false
    });

    await sendEmail({
      email: normalizedEmail,
      subject: "Verify Your Account",
      message: `
  <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px; border-radius:10px; max-width:500px; margin:auto; text-align:center;">
    
    <h2 style="color:#333; margin-bottom:10px;">Email Verification</h2>
    
    <p style="color:#666; font-size:14px; margin-bottom:20px;">
      Use the OTP below to verify your account
    </p>

    <div style="background:#ffffff; padding:15px 25px; display:inline-block; border-radius:8px; border:1px solid #eee;">
      <h1 style="letter-spacing:6px; margin:0; color:#111;">${otp}</h1>
    </div>

    <p style="color:#999; font-size:12px; margin-top:20px;">
      This code expires in <strong>10 minutes</strong>.
    </p>

  </div>
`
    });

    res.status(201).json({
      message: "OTP sent to email",
      email: normalizedEmail
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= VERIFY OTP =================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpire < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Verification successful",
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        balance: user.balance
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= RESEND OTP =================
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendEmail({
      email: user.email,
      subject: "New OTP Code",
      message: `<h1>${otp}</h1>`
    });

    res.json({ message: "OTP resent successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN (UPDATED SAFETY CHECK) =================
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const normalizedEmail = email.toLowerCase().trim();

//     const user = await User.findOne({ email: normalizedEmail });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     if (!user.isVerified) {
//       return res.status(400).json({ message: "Please verify your email first" });
//     }

//     if (password !== user.password) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       { id: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       message: "Login successful",
//       token,
//       user: {
//         _id: user._id.toString(),
//         email: user.email,
//         balance: user.balance
//       }
//     });

//   } catch (error) {
//     console.error("LOGIN ERROR:", error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// ================= LOGIN (UPDATED SAFETY CHECK + AUTO OTP LIKE SIGNUP) =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ================= NOT VERIFIED → SEND OTP (SAME STYLE AS SIGNUP) =================
    if (!user.isVerified) {
      const otp = Math.floor(10000 + Math.random() * 90000).toString();

      user.otp = otp;
      user.otpExpire = Date.now() + 10 * 60 * 1000;

      await user.save();

      await sendEmail({
        email: user.email,
        subject: "Verify Your Account",
        message: `
  <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px; border-radius:10px; max-width:500px; margin:auto; text-align:center;">
    
    <h2 style="color:#333; margin-bottom:10px;">Email Verification</h2>
    
    <p style="color:#666; font-size:14px; margin-bottom:20px;">
      Use the OTP below to verify your account
    </p>

    <div style="background:#ffffff; padding:15px 25px; display:inline-block; border-radius:8px; border:1px solid #eee;">
      <h1 style="letter-spacing:6px; margin:0; color:#111;">${otp}</h1>
    </div>

    <p style="color:#999; font-size:12px; margin-top:20px;">
      This code expires in <strong>10 minutes</strong>.
    </p>

  </div>
`
      });

      return res.status(400).json({
        message: "Please verify your email first"
      });
    }

    // ================= PASSWORD CHECK =================
    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ================= TOKEN =================
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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

// ================= FORGOT PASSWORD (UNCHANGED) =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: "Password Reset",
      message: `
        <p>Click below to reset password:</p>
        <a href="${resetUrl}">Reset Password</a>
      `
    });

    res.json({ message: "Reset link sent to email" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= RESET PASSWORD (UNCHANGED) =================
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

    res.json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
