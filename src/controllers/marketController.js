const Market = require("../models/Market");
const User = require("../models/User");

// ✅ BUY MACHINE
exports.buyMachine = async (req, res) => {
  try {
    const { userId, machine } = req.body;

    if (!userId || !machine) {
      return res.status(400).json({ message: "Missing required data" });
    }

    // 🔴 BLOCK: same machine already running
    const existingRunning = await Market.findOne({
      userId,
      name: machine.name,
      status: "running"
    });

    if (existingRunning) {
      return res.status(400).json({
        message: "This machine is already running. Wait until it finishes."
      });
    }

    // ✅ calculate expiry correctly
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + machine.duration);

    const newMachine = new Market({
      userId,
      name: machine.name,
      price: machine.price,
      profit: machine.profit,
      duration: machine.duration,
      purchaseDate: new Date(),
      expiryDate,
      status: "running"
    });

    await newMachine.save();

    res.status(201).json({
      message: "Machine purchased successfully",
      item: newMachine
    });

  } catch (err) {
    console.error("Buy Machine Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET USER MACHINE
exports.getUserMachines = async (req, res) => {
  try {
    const { userId } = req.params;

    const machines = await Market.find({ userId });

    const now = new Date();

    const updatedMachines = machines.map((m) => {
      let status = m.status;

      // ✅ If time is past expiry → expired
      if (now >= m.expiryDate && m.status !== "claimed") {
        status = "expired";
      }

      // ✅ If still within time → running
      if (now < m.expiryDate && m.status !== "claimed") {
        status = "running";
      }

      return {
        ...m._doc,
        status
      };
    });

    res.status(200).json({
      machines: updatedMachines
    });

  } catch (err) {
    console.error("Fetch machines error:", err);
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
