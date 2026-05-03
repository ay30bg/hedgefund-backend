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
      default: ""
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


// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },

//   password: {
//     type: String,
//     required: true
//   },

//   name: { type: String, default: "" },
//   avatar: { type: String, default: "" },
//   referralCode: { type: String, default: null },

//   balance: {
//     type: Number,
//     default: 0,
//     min: 0
//   },

//   walletAddress: {
//     type: String,
//     default: ""
//   },

//   network: {
//     type: String,
//     default: "USDT-TRC20"
//   },

//   withdrawalPassword: {
//     type: String,
//     default: ""
//   },

//   resetToken: {
//     type: String,
//     default: null
//   },

//   resetTokenExpire: {
//     type: Date,
//     default: null
//   },

//   currency: {
//     code: { type: String, default: "USD" },
//     symbol: { type: String, default: "$" },
//     rate: { type: Number, default: 1 }
//   },

//   // ================= OTP (FIXED) =================
//   isVerified: {
//     type: Boolean,
//     default: false
//   },

//   otp: {
//     type: String,
//     default: null
//   },

//   otpExpire: {
//     type: Date,
//     default: null
//   }
// }, { timestamps: true });

// module.exports = mongoose.model("User", userSchema);
