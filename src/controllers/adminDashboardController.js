const User = require("../models/User");
const Payment = require("../models/Payment");
const Withdraw = require("../models/Withdraw");
const Market = require("../models/Market");

// ===============================
// ADMIN DASHBOARD STATS
// ===============================
exports.getDashboardStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();

    // Total successful payments
    const successfulPayments = await Payment.find({
      status: "completed",
    });

    // Total revenue
    const totalRevenue = successfulPayments.reduce(
      (sum, payment) => sum + (payment.amountUSD || 0),
      0
    );

    // Total transactions
    const totalTransactions = successfulPayments.length;

    // Total plans invested
    const totalOrders = await Market.countDocuments();

    // Total machines purchased
    const totalMachinesPurchased = await Market.countDocuments();

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalRevenue,
        totalTransactions,
        totalOrders,
        totalMachinesPurchased,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};
