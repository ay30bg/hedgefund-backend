// const Payment = require("../models/Payment");
// const Withdrawal = require("../models/Withdraw");

// // =======================================
// // NORMALIZE STATUS (IMPORTANT)
// // =======================================
// const normalizeStatus = (status) => {
//   if (!status) return "pending";

//   const s = status.toLowerCase();

//   if (["waiting", "confirming"].includes(s)) return "pending";
//   if (["confirmed", "finished", "approved"].includes(s)) return "approved";
//   if (["failed", "expired", "rejected"].includes(s)) return "rejected";

//   return "pending";
// };

// // =======================================
// // GET ALL ADMIN TRANSACTIONS
// // =======================================
// const getAllTransactions = async (req, res) => {
//   try {
//     const payments = await Payment.find({})
//       .populate("userId", "email")
//       .sort({ createdAt: -1 });

//     const withdrawals = await Withdrawal.find({})
//       .populate("userId", "email")
//       .sort({ createdAt: -1 });

//     // DEPOSITS
//     const depositTx = payments.map((p) => ({
//       _id: p._id,
//       reference: p.paymentId,
//       userEmail: p.userId?.email || "Unknown",
//       amount: p.amountUSD,
//       type: "deposit",
//       status: normalizeStatus(p.status),
//       date: p.createdAt,
//     }));

//     // WITHDRAWALS
//     const withdrawalTx = withdrawals.map((w) => ({
//       _id: w._id,
//       reference: `WD-${w._id.toString().slice(-6)}`,
//       userEmail: w.userId?.email || "Unknown",
//       amount: w.amount,
//       type: "withdrawal",
//       status: normalizeStatus(w.status),
//       date: w.createdAt,
//     }));

//     const all = [...depositTx, ...withdrawalTx].sort(
//       (a, b) => new Date(b.date) - new Date(a.date)
//     );

//     res.status(200).json(all);
//   } catch (error) {
//     console.error("Get Transactions Error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // =======================================
// // UPDATE PAYMENT STATUS
// // =======================================
// const updatePaymentStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const payment = await Payment.findByIdAndUpdate(
//       id,
//       { status },
//       { new: true }
//     );

//     if (!payment) {
//       return res.status(404).json({ message: "Payment not found" });
//     }

//     res.status(200).json({
//       message: "Payment status updated",
//       data: payment,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // =======================================
// // UPDATE WITHDRAWAL STATUS
// // =======================================
// const updateWithdrawalStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const withdrawal = await Withdrawal.findByIdAndUpdate(
//       id,
//       {
//         status: status.toUpperCase(),
//         processedAt: new Date(),
//       },
//       { new: true }
//     );

//     if (!withdrawal) {
//       return res.status(404).json({ message: "Withdrawal not found" });
//     }

//     res.status(200).json({
//       message: "Withdrawal status updated",
//       data: withdrawal,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// module.exports = {
//   getAllTransactions,
//   updatePaymentStatus,
//   updateWithdrawalStatus,
// };

const Payment = require("../models/Payment");
const Withdrawal = require("../models/Withdraw");
const User = require("../models/User");

// =======================================
// GET ALL TRANSACTIONS
// =======================================
const getAllTransactions = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    const withdrawals = await Withdrawal.find({})
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    const deposits = payments.map((p) => ({
      _id: p._id,
      reference: p.paymentId,
      userEmail: p.userId?.email || "Unknown",
      amount: p.amountUSD,
      type: "deposit",

      // ADMIN VIEW STATUS (IMPORTANT)
      status: p.appStatus,

      gatewayStatus: p.status,
      credited: p.credited,
      date: p.createdAt,
    }));

    const withdraws = withdrawals.map((w) => ({
      _id: w._id,
      reference: `WD-${w._id.toString().slice(-6)}`,
      userEmail: w.userId?.email || "Unknown",
      amount: w.amount,
      type: "withdrawal",
      status: w.status,
      date: w.createdAt,
    }));

    const all = [...deposits, ...withdraws].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json(all);
  } catch (err) {
    console.error("GET TX ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================================
// UPDATE PAYMENT STATUS (ADMIN ONLY)
// =======================================
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // ===================================
    // UPDATE ADMIN STATUS ONLY
    // ===================================
    payment.appStatus = status;

    // ===================================
    // CREDIT WALLET (ONLY ONCE)
    // ===================================
    if (status === "approved" && !payment.credited) {
      const userId = payment.userId;
      const amount = Number(payment.amountUSD || 0);

      if (!userId || amount <= 0) {
        return res.status(400).json({
          message: "Invalid payment data",
        });
      }

      await User.findByIdAndUpdate(userId, {
        $inc: { balance: amount },
      });

      payment.credited = true;

      console.log(
        `💰 ADMIN CREDIT: $${amount} → User ${userId}`
      );
    }

    await payment.save();

    res.json({
      message: "Payment updated successfully",
      data: payment,
    });
  } catch (err) {
    console.error("UPDATE PAYMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================================
// UPDATE WITHDRAWAL STATUS
// =======================================
const updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const withdrawal = await Withdrawal.findByIdAndUpdate(
      id,
      {
        status,
        processedAt: new Date(),
      },
      { new: true }
    );

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    res.json({
      message: "Withdrawal updated",
      data: withdrawal,
    });
  } catch (err) {
    console.error("WITHDRAW ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllTransactions,
  updatePaymentStatus,
  updateWithdrawalStatus,
};
