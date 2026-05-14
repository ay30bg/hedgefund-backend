const User = require("../models/User");
const Payment = require("../models/Payment");
const Market = require("../models/Market");
const Investment = require("../models/Investment");

// ================= GET USERS =================
exports.getUsers = async (req, res) => {
  try {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 5;

    const search =
      req.query.search || "";

    const skip =
      (page - 1) * limit;

    // ================= SEARCH FILTER =================
    const filter = {
      email: {
        $regex: search,
        $options: "i",
      },
    };

    // ================= TOTAL USERS =================
    const totalUsers =
      await User.countDocuments(filter);

    // ================= USERS =================
    const users = await User.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    // ================= ENRICH USERS =================
    const enrichedUsers =
      await Promise.all(
        users.map(async (user) => {
          // ================= TOTAL DEPOSIT =================
          const deposits =
            await Payment.find({
              userId: user._id,
              status: "finished",
            });

          const totalDeposit =
            deposits.reduce(
              (sum, item) =>
                sum +
                (item.amountUSD || 0),
              0
            );

          // ================= ACTIVE PLANS =================
          const totalActivePlans =
            await Investment.countDocuments(
              {
                user: user._id,
                status: "active",
              }
            );

          // ================= ACTIVE MACHINES =================
          const totalMachines =
            await Market.countDocuments({
              userId: user._id,
              status: {
                $in: [
                  "running",
                  "claimable",
                ],
              },
            });

          return {
            ...user,
            totalDeposit,
            totalActivePlans,
            totalMachines,
          };
        })
      );

    res.status(200).json({
      success: true,
      users: enrichedUsers,

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(
          totalUsers / limit
        ),
        totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET USER STATS =================
exports.getUserStats = async (
  req,
  res
) => {
  try {
    const userId = req.params.id;

    // ================= USER =================
    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ================= TOTAL DEPOSIT =================
    const deposits =
      await Payment.find({
        userId,
        status: "finished",
      });

    const totalDeposit =
      deposits.reduce(
        (sum, item) =>
          sum + (item.amountUSD || 0),
        0
      );

    // ================= ACTIVE PLANS =================
    const activePlans =
      await Investment.find({
        user: userId,
        status: "active",
      }).select("plan amount");

    const totalActivePlans =
      activePlans.length;

    // ================= ACTIVE MACHINES =================
    const activeMachines =
      await Market.find({
        userId,

        status: {
          $in: [
            "running",
            "claimable",
          ],
        },
      }).select("name price");

    const totalMachines =
      activeMachines.length;

    res.status(200).json({
      success: true,

      stats: {
        totalDeposit,

        totalActivePlans,

        totalMachines,

        plans: activePlans,

        machines:
          activeMachines,
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

    // ================= TOGGLE STATUS =================
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
