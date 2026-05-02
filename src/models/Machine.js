// const mongoose = require("mongoose");

// const machineSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       unique: true
//     },

//     price: {
//       type: Number,
//       required: true
//     },

//     profit: {
//       type: Number,
//       required: true
//     },

//     duration: {
//       type: Number,
//       required: true
//     },

//     img: {
//       type: String, // store image path or URL
//       required: true
//     }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Machine", machineSchema);

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
