const mongoose = require("mongoose");
require("dotenv").config();

const Plan = require("../models/Plan");

const plans = [
  {
    name: "Starter Gold Farm",
    days: 7,
    percent: 18,
    image: "/uploads/plans/gold-coins.png",
  },
  {
    name: "Silver Growth Farm",
    days: 14,
    percent: 36,
    image: "/uploads/plans/gold-bar.png",
  },
  {
    name: "Golden Harvest Farm",
    days: 35,
    percent: 160,
    image: "/uploads/plans/gold-bar-stack.png",
  },
  {
    name: "Diamond Yield Farm",
    days: 120,
    percent: 1200,
    image: "/uploads/plans/gold-bar-stacked.png",
  },
  {
    name: "Ultimate Vault Farm",
    days: 200,
    percent: 2500,
    image: "/uploads/plans/gold-vault.png",
  },
];

const seedPlansIfEmpty = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🔥 Connected to MongoDB");

    const count = await Plan.countDocuments();

    if (count > 0) {
      console.log("⚡ Plans already exist — skipping seed");
      return;
    }

    await Plan.insertMany(plans);

    console.log("✅ Plans seeded successfully");
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
  }
};

module.exports = seedPlansIfEmpty;
