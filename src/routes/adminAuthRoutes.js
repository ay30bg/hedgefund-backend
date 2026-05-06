const express = require("express");
const router = express.Router();
const { adminLogin } = require("../controllers/adminAuthController");

// Public route
router.post("/login", adminLogin);

module.exports = router;
