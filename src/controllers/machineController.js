const Machine = require("../models/Machine");

exports.getMachines = async (req, res) => {
  try {
    const machines = await Machine.find().sort({ price: 1 });

    res.status(200).json({ machines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
