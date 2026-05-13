// const Withdrawal = require("../models/Withdraw");
// const User = require("../models/User");
// const bcrypt = require("bcryptjs");

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
//     // 3. PASSWORD CHECK (FIXED - HASHED)
//     // =========================
//     if (!password || !user.withdrawalPassword) {
//       return res.status(400).json({
//         message: "Invalid withdrawal password",
//       });
//     }

//     const isMatch = await bcrypt.compare(
//       password,
//       user.withdrawalPassword
//     );

//     if (!isMatch) {
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
//     // 9. CREATE WITHDRAWAL (FIXED - NO PASSWORD STORED)
//     // =========================
//     const withdrawal = await Withdrawal.create({
//       userId,
//       amount,
//       fee,
//       receiveAmount,
//       walletAddress: user.walletAddress,
//       network: user.network,
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

// // ================= GET USER WITHDRAWALS =================
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
const sendEmail = require("../utils/sendEmail");

// ================= CREATE WITHDRAWAL =================
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
    // 3. PASSWORD CHECK
    // =========================
    if (!password || !user.withdrawalPassword) {
      return res.status(400).json({
        message: "Invalid withdrawal password",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.withdrawalPassword
    );

    if (!isMatch) {
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
    // 5. BLOCK IF PENDING EXISTS
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

      const hoursDiff =
        (now - lastTime) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        return res.status(400).json({
          message:
            "You can only withdraw once every 24 hours",
        });
      }
    }

    // =========================
    // 7. COOLDOWN AFTER WALLET CHANGE
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
    // 8. CALCULATIONS
    // =========================
    const fee = amount * 0.05;
    const receiveAmount = amount - fee;

    // =========================
    // 9. DEDUCT BALANCE
    // =========================
    user.balance -= amount;

    await user.save();

    // =========================
    // 10. CREATE WITHDRAWAL
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

    // =========================
    // 11. SEND EMAIL
    // =========================
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Withdrawal Request Submitted",
        html: `
          <div style="font-family: Arial, sans-serif; padding:20px;">
            <h2>Withdrawal Request Submitted ⏳</h2>

            <p>Hello ${user.username || "User"},</p>

            <p>Your withdrawal request has been received successfully.</p>

            <div style="background:#f4f4f4;padding:15px;border-radius:10px;">
              <p><strong>Amount:</strong> $${amount}</p>
              <p><strong>Fee:</strong> $${fee}</p>
              <p><strong>Receive Amount:</strong> $${receiveAmount}</p>
              <p><strong>Network:</strong> ${user.network}</p>
              <p><strong>Wallet:</strong> ${user.walletAddress}</p>
              <p><strong>Status:</strong> PENDING</p>
            </div>

            <br/>

            <p>Your withdrawal is currently under review.</p>

            <p>Regards,<br/>Support Team</p>
          </div>
        `,
      });
    }

    res.status(201).json({
      message: "Withdrawal request submitted successfully",
      withdrawal,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ================= GET USER WITHDRAWALS =================
exports.getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ================= ADMIN APPROVE WITHDRAWAL =================
exports.approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal) {
      return res.status(404).json({
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "PENDING") {
      return res.status(400).json({
        message: "Withdrawal already processed",
      });
    }

    // =========================
    // UPDATE STATUS
    // =========================
    withdrawal.status = "APPROVED";
    withdrawal.approvedAt = new Date();

    await withdrawal.save();

    // =========================
    // GET USER
    // =========================
    const user = await User.findById(
      withdrawal.userId
    );

    // =========================
    // SEND SUCCESS EMAIL
    // =========================
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Withdrawal Approved",
        html: `
          <div style="font-family: Arial, sans-serif; padding:20px;">
            <h2>Withdrawal Approved ✅</h2>

            <p>Hello ${user.username || "User"},</p>

            <p>Your withdrawal request has been approved successfully.</p>

            <div style="background:#f4f4f4;padding:15px;border-radius:10px;">
              <p><strong>Amount:</strong> $${withdrawal.amount}</p>
              <p><strong>Fee:</strong> $${withdrawal.fee}</p>
              <p><strong>Receive Amount:</strong> $${withdrawal.receiveAmount}</p>
              <p><strong>Network:</strong> ${withdrawal.network}</p>
              <p><strong>Wallet:</strong> ${withdrawal.walletAddress}</p>
              <p><strong>Status:</strong> APPROVED</p>
            </div>

            <br/>

            <p>Your funds will arrive shortly.</p>

            <p>Regards,<br/>Support Team</p>
          </div>
        `,
      });
    }

    res.json({
      message: "Withdrawal approved successfully",
      withdrawal,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ================= ADMIN REJECT WITHDRAWAL =================
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal) {
      return res.status(404).json({
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "PENDING") {
      return res.status(400).json({
        message: "Withdrawal already processed",
      });
    }

    // =========================
    // REFUND USER
    // =========================
    const user = await User.findById(
      withdrawal.userId
    );

    if (user) {
      user.balance += withdrawal.amount;

      await user.save();
    }

    // =========================
    // UPDATE STATUS
    // =========================
    withdrawal.status = "REJECTED";
    withdrawal.rejectedAt = new Date();

    await withdrawal.save();

    // =========================
    // SEND EMAIL
    // =========================
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Withdrawal Rejected",
        html: `
          <div style="font-family: Arial, sans-serif; padding:20px;">
            <h2>Withdrawal Rejected ❌</h2>

            <p>Hello ${user.username || "User"},</p>

            <p>Your withdrawal request was rejected.</p>

            <div style="background:#f4f4f4;padding:15px;border-radius:10px;">
              <p><strong>Amount:</strong> $${withdrawal.amount}</p>
              <p><strong>Status:</strong> REJECTED</p>
            </div>

            <br/>

            <p>The amount has been refunded back to your account balance.</p>

            <p>Regards,<br/>Support Team</p>
          </div>
        `,
      });
    }

    res.json({
      message: "Withdrawal rejected successfully",
      withdrawal,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
