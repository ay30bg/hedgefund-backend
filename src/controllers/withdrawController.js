const Withdrawal = require("../models/Withdraw");
const User = require("../models/User");

exports.createWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, walletAddress, password } = req.body;

    if (!amount || amount < 20) {
      return res.status(400).json({ message: "Minimum withdrawal is $20" });
    }

    const user = await User.findById(userId);

    if (user.withdrawalPassword !== password) {
      return res.status(400).json({ message: "Invalid withdrawal password" });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const fee = amount * 0.05;
    const receiveAmount = amount - fee;

    // Deduct balance immediately (optional but recommended)
    user.balance -= amount;
    await user.save();

    const withdrawal = await Withdrawal.create({
      userId,
      amount,
      fee,
      receiveAmount,
      walletAddress,
      withdrawalPassword: password,
    });

    res.status(201).json({
      message: "Withdrawal request submitted",
      withdrawal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
