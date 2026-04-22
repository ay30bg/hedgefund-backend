const express = require("express");
const router = express.Router();

const { createInvestment } = require("../controllers/investController");
const { protect } = require("../middleware/authMiddleware");

router.post("/invest", protect, createInvestment);

module.exports = router;
