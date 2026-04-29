const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ================= PROFILE =================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({ user });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// ================= BIND / UPDATE WALLET =================
exports.bindWallet = async (req, res) => {
  try {
    const { walletAddress, network, password } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    const allowedNetworks = ["USDT-TRC20", "USDT-TON", "USDT-BEP20"];

    if (!network || !allowedNetworks.includes(network)) {
      return res.status(400).json({ message: "Invalid network selected" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isUpdating = !!user.walletAddress;

    // 🔐 Require withdrawal password if wallet already exists
    if (isUpdating) {
      if (!password) {
        return res.status(400).json({
          message: "Withdrawal password required to change wallet"
        });
      }

      const isMatch = await bcrypt.compare(
        password,
        user.withdrawalPassword
      );

      if (!isMatch) {
        return res.status(401).json({
          message: "Incorrect withdrawal password"
        });
      }
    }

    user.walletAddress = walletAddress;
    user.network = network;
    user.walletUpdatedAt = new Date();

    await user.save();

    res.json({
      message: isUpdating
        ? "Wallet updated successfully"
        : "Wallet bound successfully",
      walletAddress: user.walletAddress,
      network: user.network
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// ================= WITHDRAWAL PASSWORD (SET / CHANGE) =================
// exports.setWithdrawalPassword = async (req, res) => {
//   try {
//     const { password, currentPassword } = req.body;

//     if (!password) {
//       return res.status(400).json({ message: "New password is required" });
//     }

//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // 🔐 If password already exists → require current password
//     if (user.withdrawalPassword) {
//       if (!currentPassword) {
//         return res.status(400).json({
//           message: "Current password is required"
//         });
//       }

//       const isMatch = await bcrypt.compare(
//         currentPassword,
//         user.withdrawalPassword
//       );

//       if (!isMatch) {
//         return res.status(401).json({
//           message: "Incorrect current password"
//         });
//       }
//     }

//     // 🔐 Hash new password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     user.withdrawalPassword = hashedPassword;
//     await user.save();

//     res.json({
//       message: user.withdrawalPassword
//         ? "Withdrawal password updated successfully"
//         : "Withdrawal password set successfully"
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

exports.setWithdrawalPassword = async (req, res) => {
  try {
    const { password, currentPassword } = req.body;

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 If withdrawal password already exists → verify current withdrawal password
    if (user.withdrawalPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required"
        });
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        user.withdrawalPassword
      );

      if (!isMatch) {
        return res.status(401).json({
          message: "Incorrect current withdrawal password"
        });
      }
    }

    // 🚫 BLOCK: Prevent using login password as withdrawal password
    const isSameAsLoginPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (isSameAsLoginPassword) {
      return res.status(400).json({
        message: "Withdrawal password cannot be the same as account password"
      });
    }

    // 🔐 Hash new withdrawal password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.withdrawalPassword = hashedPassword;
    await user.save();

    res.json({
      message: user.withdrawalPassword
        ? "Withdrawal password updated successfully"
        : "Withdrawal password set successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// ================= GET USER PREFERENCES =================
exports.getUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      currency: user.currency || {
        code: "USD",
        symbol: "$",
        rate: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// ================= UPDATE CURRENCY =================
exports.updateCurrency = async (req, res) => {
  try {
    const { currency } = req.body;

    if (!currency || !currency.code) {
      return res.status(400).json({
        message: "Invalid currency data"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { currency },
      { new: true }
    );

    res.json({
      message: "Currency updated successfully",
      currency: updatedUser.currency
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
