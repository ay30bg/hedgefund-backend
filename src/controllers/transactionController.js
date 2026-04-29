const Payment = require("../models/Payment");
const Withdrawal = require("../models/Withdraw");

exports.getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      type = "all",
      page = 1,
      limit = 6,
    } = req.query;

    const skip = (page - 1) * limit;

    // ===== FETCH =====
    const payments = await Payment.find({ userId });
    const withdrawals = await Withdrawal.find({ userId });

    // ===== NORMALIZE =====
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

    // =========================
    // ✅ GLOBAL TOTALS (FIX)
    // =========================
    const totalDeposits = transactions
      .filter(tx => tx.type === "deposit")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalWithdrawals = transactions
      .filter(tx => tx.type === "withdraw")
      .reduce((sum, tx) => sum + tx.amount, 0);

    // ===== PAGINATION =====
    const total = transactions.length;
    const paginated = transactions.slice(skip, skip + Number(limit));

    res.json({
      data: paginated,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),

      // ✅ FIXED GLOBAL VALUES
      totalDeposits,
      totalWithdrawals,
    });

  } catch (err) {
    console.error("Transaction fetch error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
