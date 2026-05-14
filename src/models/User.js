const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================
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

    name: {
      type: String,
      default: "",
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    // ================= ACCOUNT STATUS =================
    blocked: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // ================= BALANCE =================
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWithdraw: {
      type: Number,
      default: 0,
      min: 0,
    },

    referralEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ================= WALLET =================
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

    // ================= CURRENCY =================
    currency: {
      code: {
        type: String,
        default: "USD",
      },

      symbol: {
        type: String,
        default: "$",
      },

      rate: {
        type: Number,
        default: 1,
      },
    },

    // ================= REFERRAL =================
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    hasRewardedReferral: {
      type: Boolean,
      default: false,
    },

    // ================= OTP =================
    otp: {
      type: String,
      default: null,
    },

    otpExpire: {
      type: Date,
      default: null,
    },

    // ================= RESET PASSWORD =================
    resetToken: {
      type: String,
      default: null,
    },

    resetTokenExpire: {
      type: Date,
      default: null,
    },

    // ================= USER PLANS =================
    activePlans: [
      {
        type: String,
      },
    ],

    // ================= USER MACHINES =================
    machines: [
      {
        name: {
          type: String,
          required: true,
        },

        status: {
          type: String,
          default: "active",
        },

        profit: {
          type: Number,
          default: 0,
        },

        startedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
