// const express = require("express");
// const router = express.Router();

// const { createInvestment } = require("../controllers/investController");
// const { protect } = require("../middleware/authMiddleware");

// router.post("/invest", protect, createInvestment);

// module.exports = router;

const {
  createInvestment,
  getUserInvestments
} = require("../controllers/investController");

router.post("/invest", protect, createInvestment);

// ✅ ADD THIS
router.get("/user", protect, getUserInvestments);
