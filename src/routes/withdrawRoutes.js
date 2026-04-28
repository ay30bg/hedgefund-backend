const express = require("express");
const router = express.Router();

const {
  createWithdrawal,
  getUserWithdrawals,
  // getAllWithdrawals,
  // approveWithdrawal,
  // rejectWithdrawal,
} = require("../controllers/withdrawController");

const { protect } = require("../middleware/authMiddleware");

// ======================
// USER ROUTES
// ======================

// Create withdrawal request
router.post("/", protect, createWithdrawal);

// Get logged-in user withdrawals
router.get("/my", protect, getUserWithdrawals);


// // ======================
// // ADMIN ROUTES
// // ======================

// // Get all withdrawals (admin dashboard)
// router.get("/admin/all", protect, adminOnly, getAllWithdrawals);

// // Approve withdrawal
// router.put("/admin/approve/:id", protect, adminOnly, approveWithdrawal);

// // Reject withdrawal
// router.put("/admin/reject/:id", protect, adminOnly, rejectWithdrawal);

module.exports = router;
