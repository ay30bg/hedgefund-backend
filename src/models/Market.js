const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    profit: {
      type: Number,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
    },

    purchaseDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["running", "claimable", "claimed", "expired"],
      default: "running",
      index: true,
    },

    claimedAt: {
      type: Date,
      default: null,
    },

    totalReturn: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ THIS LINE WAS MISSING
module.exports = mongoose.model("Market", marketSchema);
