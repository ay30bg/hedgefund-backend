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

// ================= GET USERS =================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({
      createdAt: -1,
    });

    // ================= FORMAT USERS =================
    const formattedUsers = users.map(
      (user) => ({
        _id: user._id,

        name: user.name,
        email: user.email,

        balance: user.balance || 0,

        totalDeposit:
          user.totalDeposit || 0,

        totalWithdraw:
          user.totalWithdraw || 0,

        referralEarnings:
          user.referralEarnings || 0,

        walletAddress:
          user.walletAddress || "",

        network:
          user.network || "",

        blocked:
          user.blocked || false,

        isVerified:
          user.isVerified || false,

        createdAt:
          user.createdAt,

        // ================= FULL ARRAYS =================
        activePlans:
          user.activePlans || [],

        machines:
          user.machines || [],

        // ================= COUNTS =================
        activePlansCount:
          user.activePlans?.length ||
          0,

        machinesCount:
          user.machines?.filter(
            (m) =>
              m.status === "active"
          ).length || 0,
      })
    );

    res.status(200).json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE USER =================
exports.updateUser = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      balance,
      walletAddress,
      network,
    } = req.body;

    const user =
      await User.findByIdAndUpdate(
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
        message:
          "User not found",
      });
    }

    // ================= FORMAT RESPONSE =================
    const formattedUser = {
      _id: user._id,

      name: user.name,
      email: user.email,

      balance:
        user.balance || 0,

      totalDeposit:
        user.totalDeposit || 0,

      totalWithdraw:
        user.totalWithdraw || 0,

      referralEarnings:
        user.referralEarnings || 0,

      walletAddress:
        user.walletAddress || "",

      network:
        user.network || "",

      blocked:
        user.blocked || false,

      isVerified:
        user.isVerified || false,

      createdAt:
        user.createdAt,

      activePlans:
        user.activePlans || [],

      machines:
        user.machines || [],

      activePlansCount:
        user.activePlans?.length ||
        0,

      machinesCount:
        user.machines?.filter(
          (m) =>
            m.status === "active"
        ).length || 0,
    };

    res.status(200).json({
      success: true,

      message:
        "User updated successfully",

      user: formattedUser,
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
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // ================= TOGGLE =================
    user.blocked =
      !user.blocked;

    await user.save();

    // ================= FORMAT RESPONSE =================
    const formattedUser = {
      _id: user._id,

      name: user.name,
      email: user.email,

      balance:
        user.balance || 0,

      totalDeposit:
        user.totalDeposit || 0,

      totalWithdraw:
        user.totalWithdraw || 0,

      referralEarnings:
        user.referralEarnings || 0,

      walletAddress:
        user.walletAddress || "",

      network:
        user.network || "",

      blocked:
        user.blocked || false,

      isVerified:
        user.isVerified || false,

      createdAt:
        user.createdAt,

      activePlans:
        user.activePlans || [],

      machines:
        user.machines || [],

      activePlansCount:
        user.activePlans?.length ||
        0,

      machinesCount:
        user.machines?.filter(
          (m) =>
            m.status === "active"
        ).length || 0,
    };

    res.status(200).json({
      success: true,

      message: user.blocked
        ? "User banned successfully"
        : "User unbanned successfully",

      user: formattedUser,
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
        message:
          "User not found",
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
