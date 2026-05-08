const express = require("express");
const router = express.Router();

const {
  createInvestment,
  getUserInvestments,
  claimInvestment,
} = require("../controllers/investController");

const { protect } = require("../middleware/authMiddleware");

// =======================
// 🔒 CREATE INVESTMENT
// =======================
router.post("/", protect, createInvestment);

// =======================
// 🔒 GET USER INVESTMENTS
// =======================
router.get("/user", protect, getUserInvestments);

// =======================
// 🔒 CLAIM INVESTMENT
// =======================
router.post("/claim/:id", protect, claimInvestment);

module.exports = router;
