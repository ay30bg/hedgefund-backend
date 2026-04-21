// models/Market.js
const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: String,
  price: Number,
  profit: Number,
  duration: Number,
  purchaseDate: Date,
  expiryDate: Date,
  status: {
    type: String,
    default: "running"
  }
}, { timestamps: true });

module.exports = mongoose.model("Market", marketSchema);
