const mongoose = require("mongoose");
const User = require("../models/User");
const Investment = require("../models/Investment");

// exports.createInvestment = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const userId = req.user.id; // from JWT middleware
//     const { plan, amount, roi, days } = req.body;

//     // ❌ VALIDATION
//     if (!plan || !amount || amount < 10) {
//       return res.status(400).json({ message: "Invalid investment data" });
//     }

//     const user = await User.findById(userId).session(session);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ❌ BALANCE CHECK (SERVER-SIDE ONLY)
//     if (user.balance < amount) {
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     const expectedIncome = (amount * roi) / 100;

//     // 💰 Deduct balance
//     user.balance -= amount;
//     await user.save({ session });

//     // 📦 Create investment
//     const investment = await Investment.create(
//       [
//         {
//           user: userId,
//           plan,
//           amount,
//           roi,
//           days,
//           expectedIncome,
//           status: "active",
//           startDate: new Date()
//         }
//       ],
//       { session }
//     );

//     await session.commitTransaction();
//     session.endSession();

//     res.status(201).json({
//       message: "Investment successful",
//       investment: investment[0],
//       newBalance: user.balance
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();

//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.createInvestment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { plan, amount, roi, days } = req.body;

    if (!plan || !amount || amount < 10) {
      await session.endSession();
      return res.status(400).json({ message: "Invalid investment data" });
    }

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    if (user.balance < amount) {
      await session.endSession();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const expectedIncome = (amount * roi) / 100;

    user.balance -= amount;
    await user.save({ session });

    const investment = await Investment.create(
      [
        {
          user: userId,
          plan,
          amount,
          roi,
          days,
          expectedIncome,
          status: "active",
          startDate: new Date()
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Investment successful",
      investment: investment[0],
      newBalance: user.balance
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("CREATE INVESTMENT ERROR:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};
