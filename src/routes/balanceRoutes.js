// routes/balanceRoutes.js
const express = require("express");
const router = express.Router();

const {
  getBalance,
  updateBalance
} = require("../controllers/balanceController");

router.get("/:id", getBalance);
router.put("/:id", updateBalance);

module.exports = router;
