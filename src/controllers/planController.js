const Plan = require("../models/Plan");

// GET ALL PLANS
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ days: 1 });

    res.status(200).json({ plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
