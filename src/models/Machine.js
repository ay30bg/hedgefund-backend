const mongoose = require("mongoose");

const userMachineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
    },

    name: String,
    profit: Number,
    duration: Number,

    purchaseDate: Date,
    expiryDate: Date,

    claimed: {
      type: Boolean,
      default: false,
    },

    claimedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserMachine", userMachineSchema);
