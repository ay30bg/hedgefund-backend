const express = require("express");
const router = express.Router();

const { getPortfolio } = require("../controllers/dashboardController");

router.get("/portfolio", getPortfolio);

module.exports = router;
