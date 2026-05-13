// const express = require("express");
// const router = express.Router();

// const {
//   createPayment,
//   paymentWebhook,
//   getMyPayments,
//   getPaymentStatus ,
// } = require("../controllers/paymentController");

// const { protect } = require("../middleware/authMiddleware");

// // USER
// router.post("/create", protect, createPayment);
// router.get("/my", protect, getMyPayments);
// router.get("/status/:id", protect, getPaymentStatus);

// // // NOWPAYMENTS WEBHOOK (NO AUTH)
// // router.post(
// //   "/webhook",
// //   express.raw({ type: "*/*" }), // MUST be raw
// //   paymentWebhook
// // );

// module.exports = router;

const axios = require("axios");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Referral = require("../models/Referral");

// ==============================
// CREATE PAYMENT (USDT TON)
// ==============================
exports.createPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    const userId = req.user.id;

    const amountValue = Number(amount);

    // ==============================
    // VALIDATE AMOUNT
    // ==============================
    if (!amountValue || amountValue < 5) {
      return res.status(400).json({
        error: "Minimum deposit is $5",
      });
    }

    // ==============================
    // PREVENT DUPLICATE PENDING
    // ==============================
    const existing = await Payment.findOne({
      userId,
      status: { $in: ["waiting", "confirming"] },
      createdAt: {
        $gt: Date.now() - 10 * 60 * 1000,
      },
    });

    if (existing) {
      return res.json({
        paymentId: existing.paymentId,

        address: existing.address,

        memo: existing.memo || null,

        amount: existing.payAmount,

        currency: existing.payCurrency,

        payment_status: existing.status,
      });
    }

    // ==============================
    // CREATE ORDER ID
    // ==============================
    const orderId = `TOPUP_${userId}_${Date.now()}`;

    // ==============================
    // NOWPAYMENTS REQUEST
    // ==============================
    const { data } = await axios.post(
      "https://api.nowpayments.io/v1/payment",
      {
        price_amount: amountValue,
        price_currency: "usd",

        // TON NETWORK
        pay_currency: "usdtton",

        order_id: orderId,
      },
      {
        headers: {
          "x-api-key":
            process.env.NOWPAYMENTS_API_KEY,
        },
      }
    );

    console.log("NOWPAYMENTS RESPONSE:", data);

    // ==============================
    // SAVE PAYMENT
    // ==============================
    const payment = await Payment.create({
      userId,

      paymentId: data.payment_id,

      orderId,

      amountUSD: amountValue,

      // IMPORTANT
      payAmount:
        data.pay_amount ||
        data.outcome_amount ||
        0,

      payCurrency:
        data.pay_currency || "usdtton",

      // IMPORTANT
      address:
        data.pay_address ||
        data.invoice_url ||
        "",

      // TON MEMO / COMMENT
      memo:
        data.payin_extra_id ||
        data.extra_id ||
        null,

      network: "TON",

      status:
        data.payment_status || "waiting",

      credited: false,
    });

    // ==============================
    // RETURN CLEAN RESPONSE
    // ==============================
    return res.json({
      paymentId: payment.paymentId,

      address: payment.address,

      memo: payment.memo || null,

      amount: payment.payAmount,

      currency: payment.payCurrency,

      payment_status: payment.status,
    });
  } catch (err) {
    console.error(
      "CREATE PAYMENT ERROR:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      error: "Payment creation failed",
    });
  }
};

// ==============================
// ADMIN APPROVE PAYMENT
// ==============================
exports.approvePayment = async (
  req,
  res
) => {
  try {
    const { paymentId } = req.params;

    // ==============================
    // FIND PAYMENT
    // ==============================
    const payment = await Payment.findOne({
      paymentId,
    });

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found",
      });
    }

    // ==============================
    // PREVENT DOUBLE CREDIT
    // ==============================
    if (payment.credited) {
      return res.status(400).json({
        error:
          "Payment already approved",
      });
    }

    // ==============================
    // UPDATE PAYMENT
    // ==============================
    payment.status = "finished";

    payment.credited = true;

    await payment.save();

    // ==============================
    // CREDIT USER
    // ==============================
    const user =
      await User.findByIdAndUpdate(
        payment.userId,
        {
          $inc: {
            balance: payment.amountUSD,
          },
        },
        { new: true }
      );

    console.log(
      `💰 User credited: ${user.email} +$${payment.amountUSD}`
    );

    // ==============================
    // REFERRAL BONUS
    // ==============================
    if (
      user.referredBy &&
      !user.hasRewardedReferral
    ) {
      const reward =
        payment.amountUSD * 0.05;

      // CREDIT REFERRER
      await User.findByIdAndUpdate(
        user.referredBy,
        {
          $inc: {
            balance: reward,
            referralEarnings: reward,
          },
        }
      );

      // UPDATE REFERRAL
      await Referral.findOneAndUpdate(
        {
          referredUser: user._id,
        },
        {
          reward,
          status: "Completed",
        }
      );

      // MARK USER REWARDED
      user.hasRewardedReferral = true;

      await user.save();

      console.log(
        `🎁 Referral reward sent: $${reward}`
      );
    }

    return res.json({
      success: true,
      message:
        "Payment approved successfully",
    });
  } catch (err) {
    console.error(
      "APPROVE PAYMENT ERROR:",
      err.message
    );

    return res.status(500).json({
      error:
        "Failed to approve payment",
    });
  }
};

// ==============================
// GET USER PAYMENTS
// ==============================
exports.getMyPayments = async (
  req,
  res
) => {
  try {
    const payments = await Payment.find({
      userId: req.user.id,
    }).sort({
      createdAt: -1,
    });

    return res.json(payments);
  } catch (err) {
    return res.status(500).json({
      error:
        "Failed to fetch payments",
    });
  }
};

// ==============================
// GET PAYMENT STATUS
// ==============================
exports.getPaymentStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findOne({
      paymentId: id,
    });

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found",
      });
    }

    return res.json({
      payment_status: payment.status,

      payment_id: payment.paymentId,
    });
  } catch (err) {
    return res.status(500).json({
      error:
        "Failed to get payment status",
    });
  }
};
