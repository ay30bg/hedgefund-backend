const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ================= AUTH =================
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    // ================= PROFILE =================
    name: {
      type: String,
      default: ""
    },

    avatar: {
      type: String,
      default: "https://i.pravatar.cc/100"
    },

    referralCode: {
      type: String,
      default: null
    },

    // ================= WALLET BALANCE =================
    balance: {
      type: Number,
      default: 0,
      min: 0
    },

    // ================= WALLET =================
    walletAddress: {
      type: String,
      default: ""
    },

    network: {
  type: String,
  default: "USDT-TRC20"
},

    // ================= WITHDRAWAL SECURITY =================
    withdrawalPassword: {
      type: String,
      default: ""
    },

    // ================= PASSWORD RESET =================
    resetToken: {
      type: String,
      default: null
    },

    resetTokenExpire: {
      type: Date,
      default: null
    },

    // ================= PREFERENCES =================
    currency: {
      code: {
        type: String,
        default: "USD"
      },
      symbol: {
        type: String,
        default: "$"
      },
      rate: {
        type: Number,
        default: 1
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
