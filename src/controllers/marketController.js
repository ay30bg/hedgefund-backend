// const mongoose = require("mongoose");
// const Market = require("../models/Market");
// const User = require("../models/User");
// const Machine = require("../models/Machine");

// // ✅ BUY MACHINE (FULLY FIXED & SAFE)
// exports.buyMachine = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const userId = req.user.id;
//     const { machineId } = req.body;

//     if (!machineId) {
//       return res.status(400).json({ message: "Machine ID required" });
//     }

//     // 🔍 Get machine (trusted source)
//     const machine = await Machine.findById(machineId).session(session);
//     if (!machine) {
//       await session.abortTransaction();
//       return res.status(404).json({ message: "Machine not found" });
//     }

//     // 🔴 FIX 1: ATOMIC BALANCE DEDUCTION (prevents race condition)
//     const user = await User.findOneAndUpdate(
//       {
//         _id: userId,
//         balance: { $gte: machine.price },
//       },
//       {
//         $inc: { balance: -machine.price },
//       },
//       {
//         new: true,
//         session,
//       }
//     );

//     if (!user) {
//       await session.abortTransaction();
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     // 🔴 FIX 2: USE machineId (NOT NAME)
//     const existingRunning = await Market.findOne({
//       userId,
//       machineId,
//       status: "running",
//     }).session(session);

//     if (existingRunning) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         message: "This machine is already running.",
//       });
//     }

//     // ⏳ expiry
//     const expiryDate = new Date();
//     expiryDate.setDate(expiryDate.getDate() + machine.duration);

//     // 📦 save purchase
//     const newMachine = await Market.create(
//       [
//         {
//           userId,
//           machineId: machine._id,
//           name: machine.name,
//           price: machine.price,
//           profit: machine.profit,
//           duration: machine.duration,
//           purchaseDate: new Date(),
//           expiryDate,
//           status: "running",
//         },
//       ],
//       { session }
//     );

//     await session.commitTransaction();
//     session.endSession();

//     return res.status(201).json({
//       message: "Machine purchased successfully",
//       item: newMachine[0],
//       balance: user.balance,
//     });

//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();

//     console.error("Buy Machine Error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ✅ GET USER MACHINE
// exports.getUserMachines = async (req, res) => {
//   try {
//     const userId = req.user.id; // 🔐 FIX: use JWT, NOT params

//     const machines = await Market.find({ userId });

//     const now = new Date();

//     const updatedMachines = machines.map((m) => {
//       let status = m.status;

//       if (now >= m.expiryDate && m.status !== "claimed") {
//         status = "expired";
//       }

//       if (now < m.expiryDate && m.status !== "claimed") {
//         status = "running";
//       }

//       return {
//         ...m._doc,
//         status,
//       };
//     });

//     return res.status(200).json({
//       machines: updatedMachines,
//     });

//   } catch (err) {
//     console.error("Fetch machines error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ✅ OPTIONAL: UPDATE MACHINE STATUS (EXPIRED)
// exports.updateExpiredMachines = async (req, res) => {
//   try {
//     const now = new Date();

//     await Market.updateMany(
//       { expiryDate: { $lt: now }, status: "running" },
//       { status: "expired" }
//     );

//     res.status(200).json({ message: "Expired machines updated" });

//   } catch (error) {
//     console.error("Update Expiry Error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


const mongoose = require("mongoose");
const Market = require("../models/Market");
const User = require("../models/User");
const Machine = require("../models/Machine");

// ==============================
// BUY MACHINE (FULLY FIXED)
// ==============================
exports.buyMachine = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { machineId } = req.body;

    if (!machineId) {
      return res.status(400).json({ message: "Machine ID required" });
    }

    // 🔍 Get machine
    const machine = await Machine.findById(machineId).session(session);
    if (!machine) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Machine not found" });
    }

    const now = new Date();

    // 🚫 OPTION A: Block SAME machine if still active
    const existingActive = await Market.findOne({
      userId,
      machineId: machine._id,
      status: "running",
      expiryDate: { $gt: now },
    }).session(session);

    if (existingActive) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "You already own this machine and it's still active.",
      });
    }

    // 💰 ATOMIC BALANCE DEDUCTION (prevents race condition)
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

    // ⏳ Expiry
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + machine.duration);

    // 📦 Save purchase
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
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// GET USER MACHINES (FIXED)
// ==============================
exports.getUserMachines = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const machines = await Market.find({ userId });

    const updatedMachines = machines.map((m) => {
      let status = m.status;

      if (now >= m.expiryDate && m.status !== "claimed") {
        status = "expired";
      }

      if (now < m.expiryDate && m.status !== "claimed") {
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
// UPDATE EXPIRED MACHINES
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

    res.status(200).json({
      message: "Expired machines updated",
    });

  } catch (error) {
    console.error("Update Expiry Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
