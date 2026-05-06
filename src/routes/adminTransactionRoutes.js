const express = require("express");
const router = express.Router();

const {
  getAllTransactions,
  updatePaymentStatus,
  updateWithdrawalStatus,
} = require("../controllers/adminTransactionController");

// ============================
// GET ALL TRANSACTIONS
// ============================
router.get("/", getAllTransactions);

// ============================
// UPDATE PAYMENT STATUS
// ============================
router.patch("/deposit/:id", updatePaymentStatus);

// ============================
// UPDATE WITHDRAWAL STATUS
// ============================
router.patch("/withdrawal/:id", updateWithdrawalStatus);

module.exports = router;
