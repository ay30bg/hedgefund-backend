const axios = require("axios");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");

// ==============================
// CREATE PAYMENT (BSC)
// ==============================
exports.createPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    const amountValue = Number(amount);

    if (!amountValue || amountValue < 10) {
      return res.status(400).json({ error: "Minimum deposit is $10" });
    }

    const baseURL = process.env.BASE_URL;

    if (!baseURL || !baseURL.startsWith("http")) {
      return res.status(500).json({
        error: "BASE_URL is missing or invalid in .env",
      });
    }

    // Prevent duplicate pending payments (simple idempotency)
    const existing = await Payment.findOne({
      userId,
      status: { $ne: "finished" },
      createdAt: { $gt: Date.now() - 10 * 60 * 1000 }, // last 10 mins
    });

    if (existing) {
      return res.json(existing);
    }

    const orderId = `TOPUP_${userId}_${Date.now()}`;

    const { data } = await axios.post(
      "https://api.nowpayments.io/v1/payment",
      {
        price_amount: amountValue,
        price_currency: "usd",
        pay_currency: "usdtbsc",
        order_id: orderId,
        ipn_callback_url: `${baseURL}/api/payments/webhook`,
      },
      {
        headers: {
          "x-api-key": process.env.NOWPAYMENTS_API_KEY,
        },
      }
    );

    await Payment.create({
      userId,
      paymentId: data.payment_id,
      orderId,
      amountUSD: amountValue,
      payAmount: data.pay_amount,
      payCurrency: data.pay_currency,
      address: data.pay_address,
      status: data.payment_status,
      credited: false,
    });

    return res.json(data);
  } catch (err) {
    console.error("CREATE PAYMENT ERROR:", err.response?.data || err.message);
    return res.status(500).json({ error: "Payment creation failed" });
  }
};

// ==============================
// WEBHOOK (AUTO CREDIT)
// ==============================
exports.paymentWebhook = async (req, res) => {
  try {
    const payload = req.body;

    console.log("WEBHOOK RECEIVED:", payload);

    // =========================
    // SAFE ENV CHECK
    // =========================
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    if (!ipnSecret) {
      console.error("IPN secret missing");
      return res.sendStatus(500);
    }

    // =========================
    // SIGNATURE VERIFY
    // =========================
    const receivedSig = req.headers["x-nowpayments-sig"];

    const hmac = crypto
      .createHmac("sha512", ipnSecret)
      .update(JSON.stringify(payload))
      .digest("hex");

    // if (hmac !== receivedSig) {
    //   console.log("❌ Invalid signature");
    //   return res.sendStatus(401);
    // }

    // =========================
    // FIX FIELD NAME ISSUE
    // =========================
    const payment = await Payment.findOne({
      paymentId: payload.payment_id,
    });

    if (!payment) {
      console.log("Payment not found");
      return res.sendStatus(200);
    }


// ==============================
// GET USER PAYMENTS
// ==============================
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// ==============================
// GET PAYMENT STATUS
// ==============================
exports.getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findOne({ paymentId: id });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    return res.json({
      payment_status: payment.status,
      payment_id: payment.paymentId,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to get status" });
  }
};
