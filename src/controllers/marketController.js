const mongoose = require("mongoose");
const Market = require("../models/Market");
const User = require("../models/User");
const Machine = require("../models/Machine");

// ==============================
// BUY MACHINE (FIXED - NO DUPLICATES)
// ==============================
exports.buyMachine = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { machineId } = req.body;

    if (!machineId) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Machine ID required" });
    }

    // 🔍 Get machine
    const machine = await Machine.findById(machineId).session(session);

    if (!machine) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Machine not found" });
    }

    const now = new Date();

    // 🚫 FIXED: BLOCK ACTIVE MACHINE (TIME-BASED ONLY — RELIABLE)
    const existingActive = await Market.findOne({
      userId,
      machineId: machine._id,
      expiryDate: { $gt: now }, // ONLY TRUTH SOURCE
    }).session(session);

    if (existingActive) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "You already own this machine and it's still active.",
      });
    }

    // 💰 ATOMIC BALANCE DEDUCTION (fixes race condition)
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        balance: { $gte: machine.price },
      },
      {
        $inc: { balance: -machine.price },
      },
      {
        new: true,
        session,
      }
    );

    if (!user) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // ⏳ EXPIRY CALCULATION
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + machine.duration);

    // 📦 CREATE PURCHASE
    const newPurchase = await Market.create(
      [
        {
          userId,
          machineId: machine._id,
          name: machine.name,
          price: machine.price,
          profit: machine.profit,
          duration: machine.duration,
          purchaseDate: now,
          expiryDate,
          status: "running",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Machine purchased successfully",
      item: newPurchase[0],
      balance: user.balance,
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Buy Machine Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// GET USER MACHINES (CLEANED)
// ==============================
exports.getUserMachines = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const machines = await Market.find({ userId });

    const updatedMachines = machines.map((m) => {
      let status = m.status;

      // 🔥 RELIABLE STATUS CALCULATION
      if (m.expiryDate && now >= m.expiryDate) {
        status = "expired";
      } else {
        status = "running";
      }

      return {
        ...m._doc,
        status,
      };
    });

    return res.status(200).json({
      machines: updatedMachines,
    });

  } catch (err) {
    console.error("Fetch machines error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// UPDATE EXPIRED MACHINES (OPTIONAL SAFETY JOB)
// ==============================
exports.updateExpiredMachines = async (req, res) => {
  try {
    const now = new Date();

    await Market.updateMany(
      {
        expiryDate: { $lt: now },
        status: "running",
      },
      {
        $set: { status: "expired" },
      }
    );

    return res.status(200).json({
      message: "Expired machines updated",
    });

  } catch (error) {
    console.error("Update Expiry Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// CLAIM MACHINE PROFIT
// ==============================
exports.claimMachine = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { id } = req.params;

    const machine = await Market.findOne({
      _id: id,
      userId,
    }).session(session);

    if (!machine) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Machine not found" });
    }

    const now = new Date();

    // ❌ Not yet expired
    if (!machine.expiryDate || now < machine.expiryDate) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Machine is still running",
      });
    }

    // ❌ Already claimed
    if (machine.claimed) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Already claimed",
      });
    }

    // 💰 CALCULATE TOTAL EARNINGS
    const totalEarnings =
      (machine.profit || 0) * 24 * (machine.duration || 0);

    // 💰 CREDIT USER (ATOMIC)
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { balance: totalEarnings },
      },
      { new: true, session }
    );

    // ✅ MARK CLAIMED
    machine.claimed = true;
    machine.status = "expired";
    await machine.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Machine profit claimed successfully",
      amount: totalEarnings,
      balance: user.balance,
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Claim Machine Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
