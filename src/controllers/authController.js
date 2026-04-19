// const User = require("../models/User");
// const bcrypt = require("bcryptjs");

// // ================= SIGNUP =================
// exports.signup = async (req, res) => {
//   try {
//     const { email, password, referralCode } = req.body;

//     // Check if user exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create user
//     const user = await User.create({
//       email,
//       password: hashedPassword,
//       referralCode
//     });

//     res.status(201).json({
//       message: "Signup successful",
//       user: {
//         id: user._id,
//         email: user.email
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ================= LOGIN =================
// exports.login = async (req, res) => {
//   try {
//     const { emailOrPhone, password } = req.body;

//     // Only email supported for now
//     const user = await User.findOne({ email: emailOrPhone });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     res.json({
//       message: "Login successful",
//       user: {
//         id: user._id,
//         email: user.email
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


const User = require("../models/User");

// ================= SIGNUP =================
exports.signup = async (req, res) => {
  try {
    const { email, password, referralCode } = req.body;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user (PLAIN PASSWORD)
    const user = await User.create({
      email: normalizedEmail,
      password: password,
      referralCode: referralCode || null
    });

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Plain password comparison
    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
