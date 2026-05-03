// const Market = require("../models/Market");        
// const Investment = require("../models/Investment"); 

// exports.getPortfolio = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const now = new Date();

//     // ================= FETCH USER DATA =================
//     const userMachines = await Market.find({ userId });
//     const userInvestments = await Investment.find({ user: userId });

//     // ================= ACTIVE FILTER =================
//     const activeMachines = userMachines.filter(
//       (m) => m.expiryDate && m.expiryDate > now
//     );

//     const activeInvestments = userInvestments.filter(
//       (i) => i.endDate && i.endDate > now
//     );

//     // ================= BEST MACHINE =================
//     const bestMachine =
//       activeMachines.length > 0
//         ? activeMachines.reduce((prev, curr) =>
//             curr.profit > prev.profit ? curr : prev
//           )
//         : null;

//     const bestDailyYield = bestMachine ? bestMachine.profit * 24 : 0;

//     // ================= ROI CALCULATION =================
//     const totalInvested = userInvestments.reduce(
//       (sum, inv) => sum + inv.amount,
//       0
//     );

//     const totalProfit = userInvestments.reduce(
//       (sum, inv) => sum + inv.expectedIncome,
//       0
//     );

//     let rawRoiPower =
//       totalInvested > 0
//         ? (totalProfit / totalInvested) * 100
//         : 0;

//     // ✅ CAP ROI AT 100%
//     const roiPower = Math.min(100, Math.round(rawRoiPower));

//     // ================= MARKET / RISK =================
//     let marketStatus = "Stable";
//     let marketNote = "Moderate returns";
//     let riskLevel = "Medium";

//     if (roiPower >= 80) {
//       marketStatus = "High Growth";
//       marketNote = "Strong performance • Higher risk";
//       riskLevel = "High";
//     } else if (roiPower < 30) {
//       marketStatus = "Low Yield";
//       marketNote = "Stable • Low returns";
//       riskLevel = "Low";
//     }

//     // ================= EFFICIENCY =================
//     const efficiency =
//       activeMachines.length > 0
//         ? Math.min(100, Math.round((activeMachines.length / 10) * 100))
//         : 0;

//     // ================= RESPONSE =================
//     res.json({
//       portfolio: {
//         assetSummary: {
//           // ACTIVE
//           plansCount: activeInvestments.length,
//           machinesCount: activeMachines.length,

//           // TOTAL OWNED
//           totalOwnedPlans: userInvestments.length,
//           totalOwnedMachines: userMachines.length,

//           // EXPIRED
//           expiredPlans:
//             userInvestments.length - activeInvestments.length,
//           expiredMachines:
//             userMachines.length - activeMachines.length,

//           // PERFORMANCE
//           bestDailyYield,
//           bestMachineName: bestMachine?.name || null,
//         },

//         strength: {
//           roiPower, // capped at 100%
//           efficiency,
//           riskLevel,
//         },

//         market: {
//           status: marketStatus,
//           note: marketNote,
//         },
//       },
//     });
//   } catch (err) {
//     console.error("Portfolio Error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// exports.getEarningsOverview = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const investments = await Investment.find({ user: userId });
//     const machines = await Market.find({ userId });

//     const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

//     const dataMap = days.map((d) => ({
//       day: d,
//       profit: 0,
//     }));

//     // ================= INVESTMENT EARNINGS =================
//     investments.forEach((inv) => {
//       const date = new Date(inv.createdAt);
//       const day = days[date.getDay() === 0 ? 6 : date.getDay() - 1];

//       const index = dataMap.findIndex((d) => d.day === day);
//       if (index !== -1) {
//         dataMap[index].profit += inv.expectedIncome || 0;
//       }
//     });

//     // ================= MACHINE EARNINGS =================
//     machines.forEach((m) => {
//       const date = new Date(m.purchaseDate);
//       const day = days[date.getDay() === 0 ? 6 : date.getDay() - 1];

//       const index = dataMap.findIndex((d) => d.day === day);
//       if (index !== -1) {
//         dataMap[index].profit += (m.profit || 0) * 24;
//       }
//     });

//     res.json({ earnings: dataMap });
//   } catch (err) {
//     console.error("Earnings Error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


const mongoose = require("mongoose");
const Market = require("../models/Market");
const Investment = require("../models/Investment");
const Withdrawal = require("../models/Withdraw");

exports.getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // ================= FETCH USER DATA =================
    const userMachines = await Market.find({ userId });
    const userInvestments = await Investment.find({ user: userId });

    // ================= ACTIVE FILTER =================
    const activeMachines = userMachines.filter(
      (m) => m.expiryDate && m.expiryDate > now
    );

    const activeInvestments = userInvestments.filter(
      (i) => i.endDate && i.endDate > now
    );

    // ================= TOTAL INVESTED =================
    const investmentTotal = userInvestments.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );

    const machineInvestment = userMachines.reduce(
      (sum, m) => sum + (m.price || 0),
      0
    );

    const totalInvested = investmentTotal + machineInvestment;

    // ================= TOTAL PROFIT =================
    const investmentProfit = userInvestments.reduce(
      (sum, inv) => sum + (inv.expectedIncome || 0),
      0
    );

    const machineProfit = userMachines.reduce(
      (sum, m) => sum + (m.profit || 0) * 24,
      0
    );

    const totalProfit = investmentProfit + machineProfit;

    // ================= TOTAL WITHDRAWN =================
    const totalWithdrawnAgg = await Withdrawal.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "APPROVED",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$receiveAmount" }, // ✅ user actually received
        },
      },
    ]);

    const totalWithdrawn = totalWithdrawnAgg[0]?.total || 0;

    // ================= BEST MACHINE =================
    const bestMachine =
      activeMachines.length > 0
        ? activeMachines.reduce((prev, curr) =>
            curr.profit > prev.profit ? curr : prev
          )
        : null;

    const bestDailyYield = bestMachine ? bestMachine.profit * 24 : 0;

    // ================= ROI CALCULATION =================
    let rawRoiPower =
      totalInvested > 0
        ? (totalProfit / totalInvested) * 100
        : 0;

    const roiPower = Math.min(100, Math.round(rawRoiPower));

    // ================= MARKET / RISK =================
    let marketStatus = "Stable";
    let marketNote = "Moderate returns";
    let riskLevel = "Medium";

    if (roiPower >= 80) {
      marketStatus = "High Growth";
      marketNote = "Strong performance • Higher risk";
      riskLevel = "High";
    } else if (roiPower < 30) {
      marketStatus = "Low Yield";
      marketNote = "Stable • Low returns";
      riskLevel = "Low";
    }

    // ================= EFFICIENCY =================
    const efficiency =
      activeMachines.length > 0
        ? Math.min(100, Math.round((activeMachines.length / 10) * 100))
        : 0;

    // ================= RESPONSE =================
    res.json({
      portfolio: {
        totals: {
          totalInvested,
          totalProfit,
          totalWithdrawn,
        },

        assetSummary: {
          // ACTIVE
          plansCount: activeInvestments.length,
          machinesCount: activeMachines.length,

          // TOTAL OWNED
          totalOwnedPlans: userInvestments.length,
          totalOwnedMachines: userMachines.length,

          // EXPIRED
          expiredPlans:
            userInvestments.length - activeInvestments.length,
          expiredMachines:
            userMachines.length - activeMachines.length,

          // PERFORMANCE
          bestDailyYield,
          bestMachineName: bestMachine?.name || null,
        },

        strength: {
          roiPower,
          efficiency,
          riskLevel,
        },

        market: {
          status: marketStatus,
          note: marketNote,
        },
      },
    });
  } catch (err) {
    console.error("Portfolio Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getEarningsOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    const investments = await Investment.find({ user: userId });
    const machines = await Market.find({ userId });

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const dataMap = days.map((d) => ({
      day: d,
      profit: 0,
    }));

    // ================= INVESTMENT EARNINGS =================
    investments.forEach((inv) => {
      const date = new Date(inv.createdAt);
      const day = days[date.getDay() === 0 ? 6 : date.getDay() - 1];

      const index = dataMap.findIndex((d) => d.day === day);
      if (index !== -1) {
        dataMap[index].profit += inv.expectedIncome || 0;
      }
    });

    // ================= MACHINE EARNINGS =================
    machines.forEach((m) => {
      const date = new Date(m.purchaseDate);
      const day = days[date.getDay() === 0 ? 6 : date.getDay() - 1];

      const index = dataMap.findIndex((d) => d.day === day);
      if (index !== -1) {
        dataMap[index].profit += (m.profit || 0) * 24;
      }
    });

    res.json({ earnings: dataMap });
  } catch (err) {
    console.error("Earnings Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
