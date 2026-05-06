const express = require("express");
const router = express.Router();

const {
  getAllTransactions,
  updatePaymentStatus,
  updateWithdrawalStatus,
} = require("../controllers/adminTransactionController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// ======================================
// GET ALL TRANSACTIONS (ADMIN ONLY)
// ======================================
router.get(
  "/",
  protect,
  adminOnly,
  getAllTransactions
);

// ======================================
// UPDATE DEPOSIT (PAYMENT) STATUS
// ======================================
router.patch(
  "/deposit/:id",
  protect,
  adminOnly,
  updatePaymentStatus
);

// ======================================
// UPDATE WITHDRAWAL STATUS
// ======================================
router.patch(
  "/withdrawal/:id",
  protect,
  adminOnly,
  updateWithdrawalStatus
);

module.exports = router;
