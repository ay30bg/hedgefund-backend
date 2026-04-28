const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    paymentId: {
      type: String,
      required: true,
      unique: true,
    },

    orderId: {
      type: String,
      required: true,
    },

    amountUSD: {
      type: Number,
      required: true,
    },

    payAmount: Number,
    payCurrency: String,
    address: String,

    status: {
      type: String,
      enum: ["waiting", "confirming", "finished", "failed", "expired"],
      default: "waiting",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
