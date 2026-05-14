const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
} = require("../controllers/adminDashboardController");


router.get(
  "/dashboard-stats",
  // protectAdmin,
  getDashboardStats
);

module.exports = router;
