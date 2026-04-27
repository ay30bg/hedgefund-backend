const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  plan: String,
  amount: Number,
  roi: Number,
  days: Number,
  expectedIncome: Number,
  status: {
    type: String,
    default: "active"
  },
  startDate: Date,
  endDate: Date, 
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

module.exports = mongoose.model("Investment", investmentSchema);
