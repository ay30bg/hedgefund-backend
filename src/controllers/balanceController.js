// controllers/balanceController.js
const User = require("../models/User");

// GET BALANCE
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE BALANCE (DEDUCT / ADD)
exports.updateBalance = async (req, res) => {
  try {
    const { amount } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.balance = amount;

    await user.save();

    res.json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
