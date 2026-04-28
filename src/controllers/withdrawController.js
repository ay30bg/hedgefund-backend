const Withdrawal = require("../models/Withdraw");
const User = require("../models/User");

exports.createWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, walletAddress, password } = req.body;

    // =========================
    // 1. MINIMUM CHECK
    // =========================
    if (!amount || amount < 20) {
      return res.status(400).json({ message: "Minimum withdrawal is $20" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // =========================
    // 2. PASSWORD CHECK
    // =========================
    if (user.withdrawalPassword !== password) {
      return res.status(400).json({ message: "Invalid withdrawal password" });
    }

    // =========================
    // 3. BALANCE CHECK
    // =========================
    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // =========================
    // 4. BLOCK IF PENDING EXISTS
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
    // 5. 24 HOURS LIMIT CHECK
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
    // 6. CALCULATIONS
    // =========================
    const fee = amount * 0.05;
    const receiveAmount = amount - fee;

    // Deduct balance immediately
    user.balance -= amount;
    await user.save();

    // =========================
    // 7. CREATE WITHDRAWAL
    // =========================
    const withdrawal = await Withdrawal.create({
      userId,
      amount,
      fee,
      receiveAmount,
      walletAddress,
      withdrawalPassword: password,
      status: "PENDING",
    });

    res.status(201).json({
      message: "Withdrawal request submitted successfully",
      withdrawal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
