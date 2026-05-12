const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    name: { type: String, default: "" },
    avatar: { type: String, default: "" },

    // ================= REFERRAL =================
    referralCode: {
      type: String,
      unique: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    referralEarnings: {
      type: Number,
      default: 0,
    },

    hasRewardedReferral: {
      type: Boolean,
      default: false,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    walletAddress: {
      type: String,
      default: "",
    },

    network: {
      type: String,
      default: "USDT-TRC20",
    },

    withdrawalPassword: {
      type: String,
      default: "",
    },

    resetToken: {
      type: String,
      default: null,
    },

    resetTokenExpire: {
      type: Date,
      default: null,
    },

    currency: {
      code: { type: String, default: "USD" },
      symbol: { type: String, default: "$" },
      rate: { type: Number, default: 1 },
    },

    // ================= OTP =================
    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpire: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
