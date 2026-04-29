const express = require("express");
const router = express.Router();
const { getUserTransactions } = require("../controllers/transactionController");

router.get("/:userId", getUserTransactions);

module.exports = router;
