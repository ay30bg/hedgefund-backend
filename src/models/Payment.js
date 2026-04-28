// const mongoose = require("mongoose");

// const paymentSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     paymentId: {
//       type: String,
//       required: true,
//       unique: true,
//     },

//     orderId: {
//       type: String,
//       required: true,
//     },

//     amountUSD: {
//       type: Number,
//       required: true,
//     },

//     payAmount: Number,
//     payCurrency: String,
//     address: String,

//     status: {
//       type: String,
//       enum: ["waiting", "confirming", "finished", "failed", "expired"],
//       default: "waiting",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Payment", paymentSchema);

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    orderId: {
      type: String,
      required: true,
      index: true,
    },

    amountUSD: {
      type: Number,
      required: true,
    },

    payAmount: Number,
    payCurrency: String,
    address: String,

    // ==============================
    // PAYMENT STATUS FROM NOWPAYMENTS
    // ==============================
    status: {
      type: String,
      enum: [
        "waiting",
        "confirming",
        "confirmed",
        "sending",
        "finished",
        "failed",
        "refunded",
        "expired",
      ],
      default: "waiting",
      index: true,
    },

    // ==============================
    // SAFETY FLAG (PREVENT DOUBLE CREDIT)
    // ==============================
    credited: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ==============================
    // OPTIONAL AUDIT FIELDS (RECOMMENDED)
    // ==============================
    txHash: {
      type: String,
      default: null,
    },

    rawWebhook: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true }
);

// ==============================
// INDEXES FOR PERFORMANCE
// ==============================
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
