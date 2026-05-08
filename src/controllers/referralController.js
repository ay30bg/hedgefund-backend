const User = require("../models/User");
const Referral = require("../models/Referral");

exports.getMyReferrals = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    const referrals = await Referral.find({
      referrer: userId,
    }).sort({
      createdAt: -1,
    });

    const totalEarned = referrals.reduce(
      (sum, item) => sum + item.reward,
      0
    );

    res.json({
      referralCode: user.referralCode,

      totalInvites: referrals.length,

      totalEarned,

      referrals: referrals.map((r) => ({
        name: r.referredName,
        status: r.status,
        reward: r.reward,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch referrals",
    });
  }
};
