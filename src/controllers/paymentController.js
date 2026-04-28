const axios = require("axios");
const Payment = require("../models/Payment");
const User = require("../models/User");

// ==============================
// CREATE PAYMENT (BSC)
// ==============================
exports.createPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 10) {
      return res.status(400).json({ error: "Minimum deposit is $10" });
    }

    const baseURL = process.env.BASE_URL;

    if (!baseURL || !baseURL.startsWith("http")) {
      return res.status(500).json({
        error: "BASE_URL is missing or invalid in .env",
      });
    }

    const orderId = `TOPUP_${userId}_${Date.now()}`;

    const { data } = await axios.post(
      "https://api.nowpayments.io/v1/payment",
      {
        price_amount: Number(amount),
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
      amountUSD: Number(amount),
      payAmount: data.pay_amount,
      payCurrency: data.pay_currency,
      address: data.pay_address,
      status: data.payment_status,
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

    const payment = await Payment.findOne({
      paymentId: payload.payment_id,
    });

    if (!payment) return res.sendStatus(200);

    // Update status
    payment.status = payload.payment_status;
    await payment.save();

    // Credit user only once
    if (payload.payment_status === "finished") {
      const user = await User.findById(payment.userId);

      if (!user) return res.sendStatus(200);

      user.balance += payment.amountUSD;
      await user.save();
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.sendStatus(500);
  }
};

// ==============================
// GET USER PAYMENTS
// ==============================
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

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

    const payment = await Payment.findOne({
      paymentId: id,
    });

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
