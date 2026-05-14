const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
} = require("../controllers/adminDashboardController");

const { protect, adminOnly } = require("../middleware/adminAuthMiddleware");

router.get(
  "/dashboard-stats",
  protect, 
  adminOnly,
  getDashboardStats
);

module.exports = router;
