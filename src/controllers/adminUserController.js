// const User = require("../models/User");

// // ================= GET USERS =================
// exports.getUsers = async (req, res) => {
//   try {
//     const users = await User.find().sort({
//       createdAt: -1,
//     });

//     res.status(200).json({
//       success: true,
//       users,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // ================= UPDATE USER =================
// exports.updateUser = async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       balance,
//       walletAddress,
//       network,
//     } = req.body;

//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       {
//         name,
//         email,
//         balance,
//         walletAddress,
//         network,
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message:
//         "User updated successfully",
//       user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // ================= TOGGLE BAN =================
// exports.toggleBanUser = async (
//   req,
//   res
// ) => {
//   try {
//     const user = await User.findById(
//       req.params.id
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // toggle blocked status
//     user.blocked = !user.blocked;

//     await user.save();

//     res.status(200).json({
//       success: true,

//       message: user.blocked
//         ? "User banned successfully"
//         : "User unbanned successfully",

//       user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // ================= DELETE USER =================
// exports.deleteUser = async (
//   req,
//   res
// ) => {
//   try {
//     const user =
//       await User.findByIdAndDelete(
//         req.params.id
//       );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message:
//         "User deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


const User = require("../models/User");
const Payment = require("../models/Payment");
const Market = require("../models/Market");

// ================= GET USERS =================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET USER STATS =================
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;

    // USER
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // TOTAL DEPOSIT
    const deposits = await Payment.find({
      userId,
      status: "completed",
    });

    const totalDeposit = deposits.reduce(
      (sum, item) =>
        sum + (item.amountUSD || 0),
      0
    );

    // ACTIVE PLANS
    const totalActivePlans =
      user.activePlans?.length || 0;

    // MACHINES
    const totalMachines = await Market.countDocuments({
      userId,
    });

    res.status(200).json({
      success: true,

      stats: {
        totalDeposit,
        totalActivePlans,
        totalMachines,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE USER =================
exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      balance,
      walletAddress,
      network,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        balance,
        walletAddress,
        network,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "User updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= TOGGLE BAN =================
exports.toggleBanUser = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.blocked = !user.blocked;

    await user.save();

    res.status(200).json({
      success: true,

      message: user.blocked
        ? "User banned successfully"
        : "User unbanned successfully",

      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE USER =================
exports.deleteUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findByIdAndDelete(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
