const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  days: { type: Number, required: true },
  percent: { type: Number, required: true },
  image: { type: String, required: true }
});

module.exports = mongoose.model("Plan", planSchema);
