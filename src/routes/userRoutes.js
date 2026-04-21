const express = require("express");
const router = express.Router();

const {
  getProfile,
  bindWallet,
  setWithdrawalPassword,
  getUserPreferences,
  updateCurrency
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// ================= USER ROUTES (PROTECTED) =================

// Get user profile
router.get("/profile", protect, getProfile);

// Bind wallet
router.post("/bind-wallet", protect, bindWallet);

// Set withdrawal password
router.post("/set-withdrawal-password", protect, setWithdrawalPassword);

// ================= CURRENCY / PREFERENCES =================

// Get user preferences (currency, etc.)
router.get("/preferences", protect, getUserPreferences);

// Update currency only
router.patch("/preferences/currency", protect, updateCurrency);

module.exports = router;
