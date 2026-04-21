const Market = require("../models/Market");
const User = require("../models/User");

// ✅ BUY MACHINE
exports.buyMachine = async (req, res) => {
  try {
    const { userId, machine } = req.body;

    // 🔍 Validate input
    if (!userId || !machine) {
      return res.status(400).json({ message: "Missing required data" });
    }

    // 🔍 Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ❌ Check balance
    if (user.balance < machine.price) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 📅 Dates
    const purchaseDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + machine.duration);

    // 💾 Save machine
    const newMarketItem = new Market({
      userId,
      name: machine.name,
      price: machine.price,
      profit: machine.profit,
      duration: machine.duration,
      purchaseDate,
      expiryDate,
      status: "running"
    });

    await newMarketItem.save();

    // 💰 Deduct balance
    user.balance -= machine.price;
    await user.save();

    return res.status(200).json({
      message: "Machine purchased successfully",
      balance: user.balance,
      item: newMarketItem
    });

  } catch (error) {
    console.error("Buy Machine Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getUserMachines = async (req, res) => {
  try {
    const { userId } = req.params;

    const machines = await Market.find({ userId });

    res.status(200).json({ machines }); // ✅ IMPORTANT
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



// ✅ OPTIONAL: UPDATE MACHINE STATUS (EXPIRED)
exports.updateExpiredMachines = async (req, res) => {
  try {
    const now = new Date();

    await Market.updateMany(
      { expiryDate: { $lt: now }, status: "running" },
      { status: "expired" }
    );

    res.status(200).json({ message: "Expired machines updated" });

  } catch (error) {
    console.error("Update Expiry Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
