const mongoose = require("mongoose");
const User = require("../models/User");
const Investment = require("../models/Investment");

exports.createInvestment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { plan, amount, roi, days } = req.body;

    if (!plan || !amount || amount < 10 || !days) {
      await session.endSession();
      return res.status(400).json({ message: "Invalid investment data" });
    }

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    if (user.balance < amount) {
      await session.endSession();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // ✅ FIX: create start & end dates
    const startDate = new Date();

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const expectedIncome = (amount * roi) / 100;

    user.balance -= amount;
    await user.save({ session });

    const investment = await Investment.create(
      [
        {
          user: userId,
          plan,
          amount,
          roi,
          days,
          expectedIncome,
          status: "active",
          startDate,
          endDate, // ✅ THIS FIXES YOUR ISSUE
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Investment successful",
      investment: investment[0],
      newBalance: user.balance,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("CREATE INVESTMENT ERROR:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.getUserInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    const formatted = investments.map((inv) => ({
      _id: inv._id,
      name: inv.plan,
      amount: inv.amount,
      profit: inv.expectedIncome,
      days: inv.days,
      startDate: inv.startDate,
      endDate: inv.endDate, // ✅ now will exist
      status: inv.status,
    }));

    res.status(200).json({ investments: formatted });
  } catch (err) {
    console.error("GET INVESTMENTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// CLAIM INVESTMENT PROFIT
// ==============================
exports.claimInvestment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { id } = req.params;

    const investment = await Investment.findOne({
      _id: id,
      user: userId,
    }).session(session);

    if (!investment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Investment not found" });
    }

    const now = new Date();

    // ❌ Not finished yet
    if (!investment.endDate || now < investment.endDate) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Investment still running",
      });
    }

    // ❌ Already claimed
    if (investment.claimed) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Already claimed",
      });
    }

    // 💰 PROFIT
    const profit = investment.expectedIncome || 0;

    // 💰 CREDIT USER (ATOMIC)
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { balance: profit },
      },
      { new: true, session }
    );

    // ✅ MARK CLAIMED
    investment.claimed = true;
    investment.status = "completed";
    await investment.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Investment claimed successfully",
      amount: profit,
      balance: user.balance,
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("CLAIM INVESTMENT ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
