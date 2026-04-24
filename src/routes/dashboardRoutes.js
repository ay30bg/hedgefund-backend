const express = require("express");
const router = express.Router();

const { getPortfolio } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

router.get("/portfolio", protect,  getPortfolio);

module.exports = router;
