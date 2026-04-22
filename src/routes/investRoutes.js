const express = require("express");
const router = express.Router();

const {
  createInvestment,
  getUserInvestments,
} = require("../controllers/investController");

const { protect } = require("../middleware/authMiddleware");

// ✅ Create investment
router.post("/", protect, createInvestment);

// ✅ Get logged-in user's investments
router.get("/user", protect, getUserInvestments);

module.exports = router;
