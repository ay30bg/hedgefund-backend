const express = require("express");
const router = express.Router();

const {
  buyMachine,
  getUserMachines,
  updateExpiredMachines
} = require("../controllers/marketController");

// POST → Buy machine
router.post("/", buyMachine);

// GET → User machines
router.get("/user/:userId", getUserMachines);

// PATCH → Update expired machines (optional/admin)
router.patch("/expire/update", updateExpiredMachines);

module.exports = router;
