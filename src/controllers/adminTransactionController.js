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
const Referral = require("../models/Referral");

// =======================================
// NORMALIZE STATUS
// =======================================
const normalizeStatus = (status) => {
  if (!status) return "pending";

  const s = status.toLowerCase();

  if (["waiting", "confirming"].includes(s)) {
    return "pending";
  }

  if (
    ["confirmed", "finished", "approved"].includes(s)
  ) {
    return "approved";
  }

  if (
    ["failed", "expired", "rejected"].includes(s)
  ) {
    return "rejected";
  }

  return "pending";
};

// =======================================
// GET ALL ADMIN TRANSACTIONS
// =======================================
const getAllTransactions = async (
  req,
  res
) => {
  try {
    // =========================
    // PAYMENTS
    // =========================
    const payments = await Payment.find({})
      .populate("userId", "email")
      .sort({
        createdAt: -1,
      });

    // =========================
    // WITHDRAWALS
    // =========================
    const withdrawals =
      await Withdrawal.find({})
        .populate("userId", "email")
        .sort({
          createdAt: -1,
        });

    // =========================
    // FORMAT DEPOSITS
    // =========================
    const depositTx = payments.map((p) => ({
      _id: p._id,

      reference: p.paymentId,

      userEmail:
        p.userId?.email || "Unknown",

      amount: p.amountUSD,

      type: "deposit",

      status: normalizeStatus(p.status),

      date: p.createdAt,
    }));

    // =========================
    // FORMAT WITHDRAWALS
    // =========================
    const withdrawalTx = withdrawals.map(
      (w) => ({
        _id: w._id,

        reference: `WD-${w._id
          .toString()
          .slice(-6)}`,

        userEmail:
          w.userId?.email || "Unknown",

        amount: w.amount,

        type: "withdrawal",

        status: normalizeStatus(w.status),

        date: w.createdAt,
      })
    );

    // =========================
    // MERGE + SORT
    // =========================
    const all = [
      ...depositTx,
      ...withdrawalTx,
    ].sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    );

    return res.status(200).json(all);
  } catch (error) {
    console.error(
      "Get Transactions Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =======================================
// UPDATE PAYMENT STATUS
// =======================================
const updatePaymentStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { status } = req.body;

    // =========================
    // FIND PAYMENT
    // =========================
    const payment =
      await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    // =========================
    // REJECT PAYMENT
    // =========================
    if (status === "rejected") {
      payment.status = "failed";

      await payment.save();

      return res.status(200).json({
        message: "Payment rejected",
        data: payment,
      });
    }

    // =========================
    // APPROVE PAYMENT
    // =========================
    if (status === "approved") {

      // Prevent double approval
      if (payment.credited) {
        return res.status(400).json({
          message:
            "Payment already approved",
        });
      }

      // Update payment
      payment.status = "finished";

      payment.credited = true;

      await payment.save();

      // =========================
      // CREDIT USER
      // =========================
      const user =
        await User.findByIdAndUpdate(
          payment.userId,
          {
            $inc: {
              balance:
                payment.amountUSD,
            },
          },
          { new: true }
        );

      console.log(
        `💰 User credited: ${user.email} +$${payment.amountUSD}`
      );

      // =========================
      // REFERRAL BONUS
      // =========================
      if (
        user.referredBy &&
        !user.hasRewardedReferral
      ) {
        const reward =
          payment.amountUSD * 0.05;

        // Credit referrer
        await User.findByIdAndUpdate(
          user.referredBy,
          {
            $inc: {
              balance: reward,
              referralEarnings:
                reward,
            },
          }
        );

        // Update referral
        await Referral.findOneAndUpdate(
          {
            referredUser: user._id,
          },
          {
            reward,
            status: "Completed",
          }
        );

        // Mark rewarded
        user.hasRewardedReferral = true;

        await user.save();

        console.log(
          `🎁 Referral reward sent: $${reward}`
        );
      }

      return res.status(200).json({
        message: "Payment approved",
        data: payment,
      });
    }

    return res.status(400).json({
      message: "Invalid status",
    });

  } catch (error) {
    console.error(
      "Update Payment Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =======================================
// UPDATE WITHDRAWAL STATUS
// =======================================
const updateWithdrawalStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { status } = req.body;

    const withdrawal =
      await Withdrawal.findByIdAndUpdate(
        id,
        {
          status: status.toUpperCase(),

          processedAt: new Date(),
        },
        { new: true }
      );

    if (!withdrawal) {
      return res.status(404).json({
        message:
          "Withdrawal not found",
      });
    }

    return res.status(200).json({
      message:
        "Withdrawal status updated",

      data: withdrawal,
    });
  } catch (error) {
    console.error(
      "Update Withdrawal Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getAllTransactions,

  updatePaymentStatus,

  updateWithdrawalStatus,
};
