const mongoose = require("mongoose");
const User = require("../models/User");
const Investment = require("../models/Investment");

/* ================================
   CREATE INVESTMENT
================================ */
exports.createInvestment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { plan, amount, roi, days } = req.body;

    if (!plan || !amount || amount < 10 || !days) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid investment data" });
    }

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    if (user.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const expectedIncome = (amount * roi) / 100;

    // deduct capital
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
          endDate,
          claimed: false,
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

/* ================================
   GET USER INVESTMENTS
================================ */
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
      endDate: inv.endDate,
      status: inv.status,
      claimed: inv.claimed,
    }));

    return res.status(200).json({ investments: formatted });
  } catch (err) {
    console.error("GET INVESTMENTS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   CLAIM INVESTMENT
================================ */
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
      session.endSession();
      return res.status(404).json({ message: "Investment not found" });
    }

    const now = new Date();

    // not matured
    if (now < investment.endDate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Investment still running",
      });
    }

    // already claimed
    if (investment.claimed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Already claimed",
      });
    }

    // 💰 CAPITAL + PROFIT
    const capital = investment.amount || 0;
    const profit = investment.expectedIncome || 0;
    const payout = capital + profit;

    // credit user
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: payout } },
      { new: true, session }
    );

    // mark investment
    investment.claimed = true;
    investment.status = "completed";
    await investment.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Investment claimed successfully",
      capital,
      profit,
      totalPayout: payout,
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
