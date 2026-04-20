const express = require("express");
const router = express.Router();

const {
  getProfile,
  bindWallet,
  setWithdrawalPassword
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// ================= USER ROUTES (PROTECTED) =================

// Get user profile
router.get("/profile", protect, getProfile);

// Bind wallet
router.post("/bind-wallet", protect, bindWallet);

// Set withdrawal password
router.post("/set-withdrawal-password", protect, setWithdrawalPassword);

module.exports = router;
