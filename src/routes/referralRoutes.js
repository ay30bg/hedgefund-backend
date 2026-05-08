const express = require("express");
const router = require("express").Router();

const { getMyReferrals } = require("../controllers/referralController");

const { protect } = require("../middleware/authMiddleware");

router.get("/me", protect, getMyReferrals);

module.exports = router;
