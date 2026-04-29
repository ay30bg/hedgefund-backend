// const Withdrawal = require("../models/Withdraw");
// const User = require("../models/User");

// exports.createWithdrawal = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { amount, password } = req.body;

//     // =========================
//     // 1. MINIMUM CHECK
//     // =========================
//     if (!amount || amount < 20) {
//       return res.status(400).json({ message: "Minimum withdrawal is $20" });
//     }

//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // =========================
//     // 2. WALLET CHECK
//     // =========================
//     if (!user.walletAddress || !user.network) {
//       return res.status(400).json({
//         message: "Please bind a wallet before withdrawing",
//       });
//     }

//     // =========================
//     // 3. PASSWORD CHECK
//     // =========================
//     if (!password || user.withdrawalPassword !== password) {
//       return res.status(400).json({
//         message: "Invalid withdrawal password",
//       });
//     }

//     // =========================
//     // 4. BALANCE CHECK
//     // =========================
//     if (user.balance < amount) {
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     // =========================
//     // 5. BLOCK IF PENDING EXISTS
//     // =========================
//     const pendingWithdrawal = await Withdrawal.findOne({
//       userId,
//       status: "PENDING",
//     });

//     if (pendingWithdrawal) {
//       return res.status(400).json({
//         message: "You already have a pending withdrawal request",
//       });
//     }

//     // =========================
//     // 6. 24 HOURS LIMIT CHECK
//     // =========================
//     const lastWithdrawal = await Withdrawal.findOne({
//       userId,
//       status: "APPROVED",
//     }).sort({ createdAt: -1 });

//     if (lastWithdrawal) {
//       const now = new Date();
//       const lastTime = new Date(lastWithdrawal.createdAt);
//       const hoursDiff = (now - lastTime) / (1000 * 60 * 60);

//       if (hoursDiff < 24) {
//         return res.status(400).json({
//           message: "You can only withdraw once every 24 hours",
//         });
//       }
//     }

//     // =========================
//     // 7. COOLDOWN AFTER WALLET CHANGE
//     // =========================
//     if (user.walletUpdatedAt) {
//       const diff =
//         (Date.now() - new Date(user.walletUpdatedAt)) /
//         (1000 * 60 * 60);

//       if (diff < 24) {
//         return res.status(403).json({
//           message:
//             "Withdrawals disabled for 24 hours after changing wallet",
//         });
//       }
//     }

//     // =========================
//     // 8. CALCULATIONS
//     // =========================
//     const fee = amount * 0.05;
//     const receiveAmount = amount - fee;

//     // Deduct balance immediately
//     user.balance -= amount;
//     await user.save();

//     // =========================
//     // 9. CREATE WITHDRAWAL
//     // =========================
//     const withdrawal = await Withdrawal.create({
//       userId,
//       amount,
//       fee,
//       receiveAmount,
//       walletAddress: user.walletAddress,
//       network: user.network,
//       withdrawalPassword: password,
//       status: "PENDING",
//     });

//     res.status(201).json({
//       message: "Withdrawal request submitted successfully",
//       withdrawal,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getUserWithdrawals = async (req, res) => {
//   try {
//     const withdrawals = await Withdrawal.find({
//       userId: req.user.id,
//     }).sort({ createdAt: -1 });

//     res.json(withdrawals);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

const Withdrawal = require("../models/Withdraw");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.createWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, password } = req.body;

    // =========================
    // 1. MINIMUM CHECK
    // =========================
    if (!amount || amount < 20) {
      return res.status(400).json({
        message: "Minimum withdrawal is $20",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // =========================
    // 2. WALLET CHECK
    // =========================
    if (!user.walletAddress || !user.network) {
      return res.status(400).json({
        message: "Please bind a wallet before withdrawing",
      });
    }

    // =========================
    // 3. WITHDRAWAL PASSWORD CHECK (SECURE)
    // =========================
    if (!password) {
      return res.status(400).json({
        message: "Withdrawal password is required",
      });
    }

    if (!user.withdrawalPassword) {
      return res.status(400).json({
        message: "Please set withdrawal password first",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.withdrawalPassword
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid withdrawal password",
      });
    }

    // =========================
    // 4. BALANCE CHECK
    // =========================
    if (user.balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // =========================
    // 5. PENDING WITHDRAWAL CHECK
    // =========================
    const pendingWithdrawal = await Withdrawal.findOne({
      userId,
      status: "PENDING",
    });

    if (pendingWithdrawal) {
      return res.status(400).json({
        message: "You already have a pending withdrawal request",
      });
    }

    // =========================
    // 6. 24 HOURS LIMIT CHECK
    // =========================
    const lastWithdrawal = await Withdrawal.findOne({
      userId,
      status: "APPROVED",
    }).sort({ createdAt: -1 });

    if (lastWithdrawal) {
      const now = new Date();
      const lastTime = new Date(lastWithdrawal.createdAt);
      const hoursDiff = (now - lastTime) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        return res.status(400).json({
          message: "You can only withdraw once every 24 hours",
        });
      }
    }

    // =========================
    // 7. WALLET CHANGE COOLDOWN
    // =========================
    if (user.walletUpdatedAt) {
      const diff =
        (Date.now() - new Date(user.walletUpdatedAt)) /
        (1000 * 60 * 60);

      if (diff < 24) {
        return res.status(403).json({
          message:
            "Withdrawals disabled for 24 hours after changing wallet",
        });
      }
    }

    // =========================
    // 8. CALCULATION
    // =========================
    const fee = amount * 0.05;
    const receiveAmount = amount - fee;

    // Deduct balance
    user.balance -= amount;
    await user.save();

    // =========================
    // 9. CREATE WITHDRAWAL
    // =========================
    const withdrawal = await Withdrawal.create({
      userId,
      amount,
      fee,
      receiveAmount,
      walletAddress: user.walletAddress,
      network: user.network,
      status: "PENDING",
    });

    res.status(201).json({
      message: "Withdrawal request submitted successfully",
      withdrawal,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// =========================
// GET USER WITHDRAWALS
// =========================
exports.getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
