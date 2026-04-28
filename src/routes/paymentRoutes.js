const express = require("express");
const router = express.Router();

const {
  createPayment,
  paymentWebhook,
  getMyPayments,
} = require("../controllers/paymentController");

const { protect } = require("../middleware/auth");

// USER
router.post("/create", protect, createPayment);
router.get("/my", protect, getMyPayments);

// NOWPAYMENTS WEBHOOK (NO AUTH)
router.post(
  "/webhook",
  express.json({ type: "*/*" }),
  paymentWebhook
);

module.exports = router;
