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
    // CREATE ORDER ID
    // ==============================
    const orderId = `TOPUP_${userId}_${Date.now()}`;

    // ==============================
    // CREATE NOWPAYMENTS PAYMENT
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

    console.log(
      "NOWPAYMENTS RESPONSE:",
      data
    );

    // ==============================
    // SAVE PAYMENT
    // ==============================
    const payment = await Payment.create({
      userId,

      paymentId: data.payment_id,

      orderId,

      amountUSD: amountValue,

      payAmount:
        data.pay_amount ||
        data.outcome_amount ||
        0,

      payCurrency:
        data.pay_currency || "usdtton",

      address:
        data.pay_address || "",

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
