const express = require("express");
const router = express.Router();

const { getPortfolio, getEarningsOverview } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

router.get("/portfolio", protect, getPortfolio);
router.get("/earnings", protect, getEarningsOverview);

module.exports = router;
