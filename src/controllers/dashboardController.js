// const Plan = require("../models/Plan");
// const Machine = require("../models/Machine");

// exports.getPortfolio = async (req, res) => {
//   try {
//     const plans = await Plan.find();
//     const machines = await Machine.find();

//     // ================= ROI CALC =================
//     const avgROI =
//       plans.length > 0
//         ? plans.reduce((sum, p) => sum + p.percent, 0) / plans.length
//         : 0;

//     // ================= MARKET STATUS =================
//     let marketStatus = "Stable";
//     let marketNote = "Moderate returns";
//     let riskLevel = "Medium";

//     if (avgROI > 500) {
//       marketStatus = "High Growth";
//       marketNote = "High ROI • High risk";
//       riskLevel = "High";
//     } else if (avgROI < 100) {
//       marketStatus = "Low Yield";
//       marketNote = "Low risk • Stable";
//       riskLevel = "Low";
//     }

//     // ================= BEST MACHINE =================
//     const bestMachine =
//       machines.length > 0
//         ? machines.reduce((prev, curr) =>
//             curr.profit > prev.profit ? curr : prev
//           )
//         : null;

//     const bestMachineYield = bestMachine
//       ? bestMachine.profit * 24
//       : 0;

//     // ================= EFFICIENCY (EXAMPLE LOGIC) =================
//     const efficiency =
//       machines.length > 0
//         ? Math.min(100, Math.round((machines.length / 10) * 100))
//         : 0;

//     // ================= RESPONSE =================
//     res.json({
//       portfolio: {
//         assetSummary: {
//           plansCount: plans.length,
//           machinesCount: machines.length,
//           bestDailyYield: bestMachineYield,
//           bestMachineName: bestMachine?.name || null,
//         },

//         strength: {
//           roiPower: Math.round(avgROI),
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
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const Plan = require("../models/Plan");
const Machine = require("../models/Machine");
const Market = require("../models/Market"); // ✅ IMPORTANT

exports.getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ get current user
    const now = new Date();

    const plans = await Plan.find();
    const machines = await Machine.find();

    // ✅ USER-OWNED MACHINES (THE REAL DATA YOU NEED)
    const userMachines = await Market.find({ userId });

    // ✅ OPTIONAL: ACTIVE ONLY
    const activeMachines = userMachines.filter(
      (m) => m.expiryDate && m.expiryDate > now
    );

    // ================= ROI CALC =================
    const avgROI =
      plans.length > 0
        ? plans.reduce((sum, p) => sum + p.percent, 0) / plans.length
        : 0;

    // ================= MARKET STATUS =================
    let marketStatus = "Stable";
    let marketNote = "Moderate returns";
    let riskLevel = "Medium";

    if (avgROI > 500) {
      marketStatus = "High Growth";
      marketNote = "High ROI • High risk";
      riskLevel = "High";
    } else if (avgROI < 100) {
      marketStatus = "Low Yield";
      marketNote = "Low risk • Stable";
      riskLevel = "Low";
    }

    // ================= BEST MACHINE =================
    const bestMachine =
      machines.length > 0
        ? machines.reduce((prev, curr) =>
            curr.profit > prev.profit ? curr : prev
          )
        : null;

    const bestMachineYield = bestMachine
      ? bestMachine.profit * 24
      : 0;

    // ================= EFFICIENCY =================
    const efficiency =
      activeMachines.length > 0
        ? Math.min(100, Math.round((activeMachines.length / 10) * 100))
        : 0;

    // ================= RESPONSE =================
    res.json({
      portfolio: {
        assetSummary: {
          plansCount: plans.length,

          // ✅ FIXED (use user machines, not all machines)
          machinesCount: activeMachines.length,

          totalOwnedMachines: userMachines.length, // 🔥 bonus
          expiredMachines: userMachines.length - activeMachines.length, // 🔥 bonus

          bestDailyYield: bestMachineYield,
          bestMachineName: bestMachine?.name || null,
        },

        strength: {
          roiPower: Math.round(avgROI),
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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
