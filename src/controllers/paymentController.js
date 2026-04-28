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

    const orderId = `TOPUP_${userId}_${Date.now()}`;

    const response = await axios.post(
      "https://api.nowpayments.io/v1/payment",
      {
        price_amount: amount,
        price_currency: "usd",
        pay_currency: "usdtbsc", // ✅ BSC
        order_id: orderId,
        ipn_callback_url: `${process.env.BASE_URL}/api/payments/webhook`,
      },
      {
        headers: {
          "x-api-key": process.env.NOWPAYMENTS_API_KEY,
        },
      }
    );

    const data = response.data;

    await Payment.create({
      userId,
      paymentId: data.payment_id,
      orderId,
      amountUSD: amount,
      payAmount: data.pay_amount,
      payCurrency: data.pay_currency,
      address: data.pay_address,
      status: data.payment_status,
    });

    res.json(data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Payment creation failed" });
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
