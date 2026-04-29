const User = require("../models/User");

// ================= PROFILE =================
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user });
};

// ================= BIND WALLET =================
exports.bindWallet = async (req, res) => {
  try {
    const { walletAddress, network } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    const allowedNetworks = ["USDT-TRC20", "USDT-TON", "USDT-BEP20"];

    if (!network || !allowedNetworks.includes(network)) {
      return res.status(400).json({ message: "Invalid network selected" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        walletAddress,
        network
      },
      { new: true }
    );

    res.json({
      message: "Wallet updated successfully",
      walletAddress: updatedUser.walletAddress,
      network: updatedUser.network
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= WITHDRAWAL PASSWORD =================
exports.setWithdrawalPassword = async (req, res) => {
  const { password } = req.body;

  await User.findByIdAndUpdate(req.user.id, {
    withdrawalPassword: password
  });

  res.json({ message: "Withdrawal password set" });
};

// GET user preferences
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      currency: user.currency || {
        code: "USD",
        symbol: "$",
        rate: 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE currency preference
export const updateCurrency = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currency } = req.body;

    if (!currency || !currency.code) {
      return res.status(400).json({ message: "Invalid currency data" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { currency },
      { new: true }
    );

    res.json({
      message: "Currency updated successfully",
      currency: updatedUser.currency
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
