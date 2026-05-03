const express = require("express");
const router = express.Router();

const {
  createPayment,
  paymentWebhook,
  getMyPayments,
  getPaymentStatus ,
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");

// USER
router.post("/create", protect, createPayment);
router.get("/my", protect, getMyPayments);
router.get("/status/:id", protect, getPaymentStatus);

// // NOWPAYMENTS WEBHOOK (NO AUTH)
router.post(
  "/webhook",
  express.raw({ type: "*/*" }), // MUST be raw
  paymentWebhook
);

module.exports = router;
