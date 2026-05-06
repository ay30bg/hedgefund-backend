const Payment = require("../models/Payment");
const Withdrawal = require("../models/Withdraw");

// =======================================
// NORMALIZE STATUS (IMPORTANT)
// =======================================
const normalizeStatus = (status) => {
  if (!status) return "pending";

  const s = status.toLowerCase();

  if (["waiting", "confirming"].includes(s)) return "pending";
  if (["confirmed", "finished", "approved"].includes(s)) return "approved";
  if (["failed", "expired", "rejected"].includes(s)) return "rejected";

  return "pending";
};

// =======================================
// GET ALL ADMIN TRANSACTIONS
// =======================================
const getAllTransactions = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    const withdrawals = await Withdrawal.find({})
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    // DEPOSITS
    const depositTx = payments.map((p) => ({
      _id: p._id,
      reference: p.paymentId,
      userEmail: p.userId?.email || "Unknown",
      amount: p.amountUSD,
      type: "deposit",
      status: normalizeStatus(p.status),
      date: p.createdAt,
    }));

    // WITHDRAWALS
    const withdrawalTx = withdrawals.map((w) => ({
      _id: w._id,
      reference: `WD-${w._id.toString().slice(-6)}`,
      userEmail: w.userId?.email || "Unknown",
      amount: w.amount,
      type: "withdrawal",
      status: normalizeStatus(w.status),
      date: w.createdAt,
    }));

    const all = [...depositTx, ...withdrawalTx].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.status(200).json(all);
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================================
// UPDATE PAYMENT STATUS
// =======================================
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({
      message: "Payment status updated",
      data: payment,
    });
  } catch (error) {
    console.error(error);
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
        status: status.toUpperCase(),
        processedAt: new Date(),
      },
      { new: true }
    );

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    res.status(200).json({
      message: "Withdrawal status updated",
      data: withdrawal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllTransactions,
  updatePaymentStatus,
  updateWithdrawalStatus,
};
