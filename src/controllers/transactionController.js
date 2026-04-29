// const Payment = require("../models/Payment");
// const Withdrawal = require("../models/Withdraw");

// exports.getUserTransactions = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // ===== FETCH BOTH =====
//     const payments = await Payment.find({ userId });
//     const withdrawals = await Withdrawal.find({ userId });

//     // ===== NORMALIZE PAYMENTS (DEPOSITS) =====
//     const depositTx = payments.map((p) => ({
//       id: p._id,
//       type: "deposit",
//       amount: p.amountUSD,

//       // map NOWPayments status → frontend status
//       status:
//         p.status === "finished"
//           ? "success"
//           : p.status === "failed"
//           ? "failed"
//           : "pending",

//       date: p.createdAt,
//     }));

//     // ===== NORMALIZE WITHDRAWALS =====
//     const withdrawalTx = withdrawals.map((w) => ({
//       id: w._id,
//       type: "withdraw",
//       amount: w.amount,

//       status:
//         w.status === "APPROVED"
//           ? "success"
//           : w.status === "REJECTED"
//           ? "failed"
//           : "pending",

//       date: w.createdAt,
//     }));

//     // ===== MERGE & SORT =====
//     const transactions = [...depositTx, ...withdrawalTx].sort(
//       (a, b) => new Date(b.date) - new Date(a.date)
//     );

//     res.json(transactions);

//   } catch (err) {
//     console.error("Transaction fetch error:", err);
//     res.status(500).json({ error: "Failed to fetch transactions" });
//   }
// };

const Payment = require("../models/Payment");
const Withdrawal = require("../models/Withdraw");

exports.getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;

    // ===== QUERY PARAMS =====
    const {
      type = "all",
      page = 1,
      limit = 6,
    } = req.query;

    const skip = (page - 1) * limit;

    // ===== FETCH =====
    const payments = await Payment.find({ userId });
    const withdrawals = await Withdrawal.find({ userId });

    // ===== NORMALIZE PAYMENTS =====
    let depositTx = payments.map((p) => ({
      id: p._id,
      type: "deposit",
      amount: p.amountUSD,
      status:
        p.status === "finished"
          ? "success"
          : p.status === "failed"
          ? "failed"
          : "pending",
      date: p.createdAt,
    }));

    // ===== NORMALIZE WITHDRAWALS =====
    let withdrawalTx = withdrawals.map((w) => ({
      id: w._id,
      type: "withdraw",
      amount: w.amount,
      status:
        w.status === "APPROVED"
          ? "success"
          : w.status === "REJECTED"
          ? "failed"
          : "pending",
      date: w.createdAt,
    }));

    // ===== MERGE =====
    let transactions = [...depositTx, ...withdrawalTx];

    // ===== FILTER =====
    if (type !== "all") {
      transactions = transactions.filter((tx) => tx.type === type);
    }

    // ===== SORT =====
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = transactions.length;

    // ===== PAGINATION =====
    const paginated = transactions.slice(skip, skip + Number(limit));

    res.json({
      data: paginated,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error("Transaction fetch error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
