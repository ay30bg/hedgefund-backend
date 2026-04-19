const User = require("../models/User");

// ================= PROFILE =================
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user });
};

// ================= BIND WALLET =================
exports.bindWallet = async (req, res) => {
  const { walletAddress } = req.body;

  await User.findByIdAndUpdate(req.user.id, {
    walletAddress
  });

  res.json({ message: "Wallet updated" });
};

// ================= WITHDRAWAL PASSWORD =================
exports.setWithdrawalPassword = async (req, res) => {
  const { password } = req.body;

  await User.findByIdAndUpdate(req.user.id, {
    withdrawalPassword: password
  });

  res.json({ message: "Withdrawal password set" });
};
