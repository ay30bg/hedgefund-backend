const User = require("../models/User");

// ================= PROFILE =================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= BIND / UPDATE WALLET =================
exports.bindWallet = async (req, res) => {
  try {
    const { walletAddress, network, password } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    const allowedNetworks = ["USDT-TRC20", "USDT-TON", "USDT-BEP20"];

    if (!network || !allowedNetworks.includes(network)) {
      return res.status(400).json({ message: "Invalid network selected" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isUpdating = !!user.walletAddress;

    // 🔒 Require password if changing wallet
    if (isUpdating) {
      if (!password) {
        return res.status(400).json({
          message: "Withdrawal password required to change wallet"
        });
      }

      if (password !== user.withdrawalPassword) {
        return res.status(401).json({
          message: "Incorrect withdrawal password"
        });
      }
    }

    user.walletAddress = walletAddress;
    user.network = network;
    user.walletUpdatedAt = new Date();

    await user.save();

    res.json({
      message: isUpdating
        ? "Wallet updated successfully"
        : "Wallet bound successfully",
      walletAddress: user.walletAddress,
      network: user.network
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= WITHDRAWAL PASSWORD =================
exports.setWithdrawalPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password required" });
    }

    // ❌ Plain text (NOT SAFE)
    await User.findByIdAndUpdate(req.user.id, {
      withdrawalPassword: password
    });

    res.json({ message: "Withdrawal password set successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= GET USER PREFERENCES =================
exports.getUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

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

// ================= UPDATE CURRENCY =================
exports.updateCurrency = async (req, res) => {
  try {
    const { currency } = req.body;

    if (!currency || !currency.code) {
      return res.status(400).json({ message: "Invalid currency data" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
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
