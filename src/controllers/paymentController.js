// // const axios = require("axios");
// // const crypto = require("crypto");
// // const Payment = require("../models/Payment");
// // const User = require("../models/User");
// // const Referral = require("../models/Referral");

// // // ==============================
// // // CREATE PAYMENT (BSC)
// // // ==============================
// // exports.createPayment = async (req, res) => {
// //   try {
// //     const { amount } = req.body;
// //     const userId = req.user.id;

// //     const amountValue = Number(amount);

// //     if (!amountValue || amountValue < 5) {
// //       return res.status(400).json({ error: "Minimum deposit is $5" });
// //     }

// //     const baseURL = process.env.BASE_URL;

// //     if (!baseURL || !baseURL.startsWith("http")) {
// //       return res.status(500).json({
// //         error: "BASE_URL is missing or invalid in .env",
// //       });
// //     }

// //     // Prevent duplicate pending payments (simple idempotency)
// //     const existing = await Payment.findOne({
// //       userId,
// //       status: { $ne: "finished" },
// //       createdAt: { $gt: Date.now() - 10 * 60 * 1000 }, // last 10 mins
// //     });

// //     if (existing) {
// //       return res.json(existing);
// //     }

// //     const orderId = `TOPUP_${userId}_${Date.now()}`;

// //     const { data } = await axios.post(
// //       "https://api.nowpayments.io/v1/payment",
// //       {
// //         price_amount: amountValue,
// //         price_currency: "usd",
// //         pay_currency: "usdtbsc",
// //         order_id: orderId,
// //         ipn_callback_url: `${baseURL}/api/payments/webhook`,
// //       },
// //       {
// //         headers: {
// //           "x-api-key": process.env.NOWPAYMENTS_API_KEY,
// //         },
// //       }
// //     );

// //     await Payment.create({
// //       userId,
// //       paymentId: data.payment_id,
// //       orderId,
// //       amountUSD: amountValue,
// //       payAmount: data.pay_amount,
// //       payCurrency: data.pay_currency,
// //       address: data.pay_address,
// //       status: data.payment_status,
// //       credited: false,
// //     });

// //     return res.json(data);
// //   } catch (err) {
// //     console.error("CREATE PAYMENT ERROR:", err.response?.data || err.message);
// //     return res.status(500).json({ error: "Payment creation failed" });
// //   }
// // };

// // // ==============================
// // // WEBHOOK (AUTO CREDIT)
// // // ==============================
// // // exports.paymentWebhook = async (req, res) => {
// // //   try {
// // //     // =========================
// // //     // 1. RAW BODY (CRITICAL)
// // //     // =========================
// // //     const rawBody = req.body.toString();

// // //     let payload;
// // //     try {
// // //       payload = JSON.parse(rawBody);
// // //     } catch (err) {
// // //       console.log("❌ Invalid JSON");
// // //       return res.sendStatus(400);
// // //     }

// // //     console.log("📩 Webhook received:", payload);

// // //     // =========================
// // //     // 2. ENV CHECK
// // //     // =========================
// // //     const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
// // //     if (!ipnSecret) {
// // //       console.error("❌ Missing IPN secret");
// // //       return res.sendStatus(500);
// // //     }

// // //     // =========================
// // //     // 3. VERIFY SIGNATURE
// // //     // =========================
// // //     const receivedSig = req.headers["x-nowpayments-sig"];

// // //     const expectedSig = crypto
// // //       .createHmac("sha512", ipnSecret)
// // //       .update(rawBody)
// // //       .digest("hex");

// // //     if (!receivedSig || expectedSig !== receivedSig) {
// // //       console.log("❌ Invalid signature");
// // //       return res.sendStatus(401);
// // //     }

// // //     // =========================
// // //     // 4. VALIDATE STATUS
// // //     // =========================
// // //     const validStatuses = [
// // //       "waiting",
// // //       "confirming",
// // //       "confirmed",
// // //       "sending",
// // //       "finished",
// // //       "failed",
// // //       "expired",
// // //     ];

// // //     if (!validStatuses.includes(payload.payment_status)) {
// // //       console.log("❌ Invalid status:", payload.payment_status);
// // //       return res.sendStatus(400);
// // //     }

// // //     // =========================
// // //     // 5. ATOMIC PAYMENT UPDATE
// // //     // =========================
// // //     const updatedPayment = await Payment.findOneAndUpdate(
// // //       {
// // //         paymentId: payload.payment_id,
// // //       },
// // //       {
// // //         $set: {
// // //           status: payload.payment_status,
// // //         },
// // //       },
// // //       { new: true }
// // //     );

// // //     if (!updatedPayment) {
// // //       console.log("⚠️ Payment not found:", payload.payment_id);
// // //       return res.sendStatus(200);
// // //     }

// // //     // =========================
// // //     // 6. CREDIT USER (ONCE ONLY)
// // //     // =========================
// // //     if (payload.payment_status === "finished") {
// // //       const creditedPayment = await Payment.findOneAndUpdate(
// // //         {
// // //           paymentId: payload.payment_id,
// // //           credited: false, // ONLY if not already credited
// // //         },
// // //         {
// // //           $set: { credited: true },
// // //         },
// // //         { new: true }
// // //       );

// // //       // Only one process will pass this
// // //       if (creditedPayment) {
// // //         await User.findByIdAndUpdate(creditedPayment.userId, {
// // //           $inc: { balance: creditedPayment.amountUSD },
// // //         });

// // //         console.log(
// // //           `✅ Credited user ${creditedPayment.userId} with $${creditedPayment.amountUSD}`
// // //         );
// // //       } else {
// // //         console.log("⚠️ Already credited (duplicate webhook)");
// // //       }
// // //     }

// // //     // =========================
// // //     // 7. OPTIONAL EXTRA LOGGING
// // //     // =========================
// // //     console.log({
// // //       payment_id: payload.payment_id,
// // //       status: payload.payment_status,
// // //       price_amount: payload.price_amount,
// // //     });

// // //     return res.sendStatus(200);
// // //   } catch (err) {
// // //     console.error("🔥 WEBHOOK ERROR:", err.message);
// // //     return res.sendStatus(500);
// // //   }
// // // };

// // exports.paymentWebhook = async (req, res) => {
// //   try {
// //     // =========================
// //     // 1. RAW BODY (REQUIRED)
// //     // =========================
// //     const rawBody = req.body.toString();

// //     let payload;
// //     try {
// //       payload = JSON.parse(rawBody);
// //     } catch (err) {
// //       console.log("❌ Invalid JSON payload");
// //       return res.sendStatus(400);
// //     }

// //     console.log("📩 Webhook received:", payload.payment_id);

// //     // =========================
// //     // 2. VERIFY SIGNATURE
// //     // =========================
// //     const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

// //     if (!ipnSecret) {
// //       console.error("❌ Missing IPN secret");
// //       return res.sendStatus(500);
// //     }

// //     const receivedSig = req.headers["x-nowpayments-sig"];

// //     const expectedSig = crypto
// //       .createHmac("sha512", ipnSecret)
// //       .update(rawBody)
// //       .digest("hex");

// //     if (!receivedSig || receivedSig !== expectedSig) {
// //       console.log("❌ Invalid signature");
// //       return res.sendStatus(401);
// //     }

// //     // =========================
// //     // 3. VALIDATE STATUS
// //     // =========================
// //     if (!payload.payment_status) {
// //       return res.sendStatus(400);
// //     }

// //     // =========================
// //     // 4. UPDATE PAYMENT STATUS
// //     // =========================
// //     const payment = await Payment.findOneAndUpdate(
// //       { paymentId: payload.payment_id },
// //       { $set: { status: payload.payment_status } },
// //       { new: true }
// //     );

// //     if (!payment) {
// //       console.log("⚠️ Payment not found:", payload.payment_id);
// //       return res.sendStatus(200);
// //     }

// //     // =========================
// //     // 5. PROCESS ONLY COMPLETED PAYMENTS
// //     // =========================
// //     if (payload.payment_status !== "finished") {
// //       return res.sendStatus(200);
// //     }

// //     // =========================
// //     // 6. IDENTITY CHECK (NO DOUBLE CREDIT)
// //     // =========================
// //     const creditedPayment = await Payment.findOneAndUpdate(
// //       {
// //         paymentId: payload.payment_id,
// //         credited: false,
// //       },
// //       { $set: { credited: true } },
// //       { new: true }
// //     );

// //     if (!creditedPayment) {
// //       console.log("⚠️ Duplicate webhook ignored");
// //       return res.sendStatus(200);
// //     }

// //     // =========================
// //     // 7. CREDIT USER BALANCE
// //     // =========================
// //     const user = await User.findByIdAndUpdate(
// //       creditedPayment.userId,
// //       {
// //         $inc: {
// //           balance: creditedPayment.amountUSD,
// //         },
// //       },
// //       { new: true }
// //     );

// //     console.log(
// //       `💰 User credited: ${user.email} +$${creditedPayment.amountUSD}`
// //     );

// //     // =========================
// //     // 8. REFERRAL SYSTEM (FIRST DEPOSIT ONLY)
// //     // =========================
// //     if (user.referredBy && !user.hasRewardedReferral) {
// //       const reward = creditedPayment.amountUSD * 0.05;

// //       // CREDIT REFERRER
// //       await User.findByIdAndUpdate(user.referredBy, {
// //         $inc: {
// //           balance: reward,
// //           referralEarnings: reward,
// //         },
// //       });

// //       // UPDATE REFERRAL RECORD
// //       await Referral.findOneAndUpdate(
// //         { referredUser: user._id },
// //         {
// //           reward,
// //           status: "Completed",
// //         }
// //       );

// //       // MARK USER AS REWARDED
// //       user.hasRewardedReferral = true;
// //       await user.save();

// //       console.log(
// //         `🎁 Referral reward sent: $${reward} to referrer ${user.referredBy}`
// //       );
// //     }

// //     // =========================
// //     // 9. FINAL RESPONSE
// //     // =========================
// //     return res.sendStatus(200);
// //   } catch (err) {
// //     console.error("🔥 WEBHOOK ERROR:", err.message);
// //     return res.sendStatus(500);
// //   }
// // };

// // // ==============================
// // // GET USER PAYMENTS
// // // ==============================
// // exports.getMyPayments = async (req, res) => {
// //   try {
// //     const payments = await Payment.find({ userId: req.user.id }).sort({
// //       createdAt: -1,
// //     });

// //     res.json(payments);
// //   } catch (err) {
// //     res.status(500).json({ error: "Failed to fetch payments" });
// //   }
// // };

// // // ==============================
// // // GET PAYMENT STATUS
// // // ==============================
// // exports.getPaymentStatus = async (req, res) => {
// //   try {
// //     const { id } = req.params;

// //     const payment = await Payment.findOne({ paymentId: id });

// //     if (!payment) {
// //       return res.status(404).json({ error: "Payment not found" });
// //     }

// //     return res.json({
// //       payment_status: payment.status,
// //       payment_id: payment.paymentId,
// //     });
// //   } catch (err) {
// //     return res.status(500).json({ error: "Failed to get status" });
// //   }
// // };


// // BACKEND — paymentsController.js

// const axios = require("axios");
// const crypto = require("crypto");

// const Payment = require("../models/Payment");
// const User = require("../models/User");
// const Referral = require("../models/Referral");

// // ==============================
// // CREATE PAYMENT (USDT TON)
// // ==============================
// exports.createPayment = async (req, res) => {
//   try {
//     const { amount } = req.body;

//     const userId = req.user.id;

//     const amountValue = Number(amount);

//     // MINIMUM = $10
//     if (!amountValue || amountValue < 5) {
//       return res.status(400).json({
//         error: "Minimum deposit is $5",
//       });
//     }

//     const baseURL = process.env.BASE_URL;

//     if (!baseURL || !baseURL.startsWith("http")) {
//       return res.status(500).json({
//         error: "BASE_URL is missing or invalid",
//       });
//     }

//     // ==============================
//     // PREVENT DUPLICATE PENDING PAYMENT
//     // ==============================
//     const existing = await Payment.findOne({
//       userId,
//       status: {
//         $nin: ["finished", "failed", "expired"],
//       },
//       createdAt: {
//         $gt: Date.now() - 10 * 60 * 1000,
//       },
//     });

//     if (existing) {
//       return res.json({
//         payment_id: existing.paymentId,
//         payment_status: existing.status,
//         pay_address: existing.address,
//         pay_amount: existing.payAmount,
//         pay_currency: existing.payCurrency,
//       });
//     }

//     // ==============================
//     // CREATE ORDER
//     // ==============================
//     const orderId = `TOPUP_${userId}_${Date.now()}`;

//     // ==============================
//     // NOWPAYMENTS REQUEST
//     // ==============================
//     const { data } = await axios.post(
//       "https://api.nowpayments.io/v1/payment",
//       {
//         price_amount: amountValue,
//         price_currency: "usd",

//         // ✅ TON NETWORK
//         pay_currency: "usdtton",

//         order_id: orderId,

//         ipn_callback_url:
//           `${baseURL}/api/payments/webhook`,
//       },
//       {
//         headers: {
//           "x-api-key":
//             process.env.NOWPAYMENTS_API_KEY,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // ==============================
//     // SAVE PAYMENT
//     // ==============================
//     await Payment.create({
//       userId,

//       paymentId: data.payment_id,

//       orderId,

//       amountUSD: amountValue,

//       payAmount: data.pay_amount,

//       payCurrency: data.pay_currency,

//       address: data.pay_address,

//       status: data.payment_status,

//       credited: false,
//     });

//     return res.json(data);
//   } catch (err) {
//     console.error(
//       "CREATE PAYMENT ERROR:",
//       err.response?.data || err.message
//     );

//     return res.status(500).json({
//       error: "Payment creation failed",
//     });
//   }
// };

// // ==============================
// // WEBHOOK
// // ==============================
// exports.paymentWebhook = async (req, res) => {
//   try {
//     // RAW BUFFER
//     const rawBody = req.body;

//     // CONVERT BUFFER TO STRING
//     const rawString = rawBody.toString("utf8");

//     // PARSE JSON
//     const payload = JSON.parse(rawString);

//     console.log(
//       "📩 Webhook received:",
//       payload.payment_id
//     );

//     // =========================
//     // VERIFY SIGNATURE
//     // =========================
//     const ipnSecret =
//       process.env.NOWPAYMENTS_IPN_SECRET;

//     const receivedSig =
//       req.headers["x-nowpayments-sig"];

//     const expectedSig = crypto
//       .createHmac("sha512", ipnSecret)
//       .update(rawString)
//       .digest("hex");

//     if (
//       !receivedSig ||
//       receivedSig !== expectedSig
//     ) {
//       console.log("❌ Invalid signature");

//       console.log({
//         receivedSig,
//         expectedSig,
//       });

//       return res.sendStatus(401);
//     }

//     // =========================
//     // UPDATE PAYMENT
//     // =========================
//     const payment =
//       await Payment.findOneAndUpdate(
//         {
//           paymentId: payload.payment_id,
//         },
//         {
//           $set: {
//             status: payload.payment_status,
//           },
//         },
//         { new: true }
//       );

//     if (!payment) {
//       console.log(
//         "⚠️ Payment not found"
//       );

//       return res.sendStatus(200);
//     }

//     // ONLY FINISHED
//     if (
//       payload.payment_status !== "finished"
//     ) {
//       return res.sendStatus(200);
//     }

//     // PREVENT DOUBLE CREDIT
//     const creditedPayment =
//       await Payment.findOneAndUpdate(
//         {
//           paymentId: payload.payment_id,
//           credited: false,
//         },
//         {
//           $set: {
//             credited: true,
//           },
//         },
//         { new: true }
//       );

//     if (!creditedPayment) {
//       console.log(
//         "⚠️ Duplicate webhook ignored"
//       );

//       return res.sendStatus(200);
//     }

//     // CREDIT USER
//     const user =
//       await User.findByIdAndUpdate(
//         creditedPayment.userId,
//         {
//           $inc: {
//             balance:
//               creditedPayment.amountUSD,
//           },
//         },
//         { new: true }
//       );

//     console.log(
//       `💰 User credited: ${user.email}`
//     );

//     // =========================
//     // REFERRAL BONUS
//     // =========================
//     if (
//       user.referredBy &&
//       !user.hasRewardedReferral
//     ) {
//       const reward =
//         creditedPayment.amountUSD * 0.05;

//       await User.findByIdAndUpdate(
//         user.referredBy,
//         {
//           $inc: {
//             balance: reward,
//             referralEarnings: reward,
//           },
//         }
//       );

//       await Referral.findOneAndUpdate(
//         {
//           referredUser: user._id,
//         },
//         {
//           reward,
//           status: "Completed",
//         }
//       );

//       user.hasRewardedReferral = true;

//       await user.save();

//       console.log(
//         `🎁 Referral reward: $${reward}`
//       );
//     }

//     return res.sendStatus(200);
//   } catch (err) {
//     console.error(
//       "🔥 WEBHOOK ERROR:",
//       err
//     );

//     return res.sendStatus(500);
//   }
// };


// // ==============================
// // GET USER PAYMENTS
// // ==============================
// exports.getMyPayments = async (req, res) => {
//   try {
//     const payments = await Payment.find({
//       userId: req.user.id,
//     }).sort({
//       createdAt: -1,
//     });

//     return res.json(payments);
//   } catch (err) {
//     return res.status(500).json({
//       error: "Failed to fetch payments",
//     });
//   }
// };

// // ==============================
// // GET PAYMENT STATUS
// // ==============================
// exports.getPaymentStatus = async (
//   req,
//   res
// ) => {
//   try {
//     const { id } = req.params;

//     const payment = await Payment.findOne({
//       paymentId: id,
//     });

//     if (!payment) {
//       return res.status(404).json({
//         error: "Payment not found",
//       });
//     }

//     return res.json({
//       payment_status: payment.status,
//       payment_id: payment.paymentId,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       error: "Failed to get status",
//     });
//   }
// };


// BACKEND — paymentsController.js

const axios = require("axios");

const Payment = require("../models/Payment");

// ==============================
// CREATE PAYMENT (MANUAL ADMIN APPROVAL)
// ==============================
exports.createPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    const userId = req.user.id;

    const amountValue = Number(amount);

    // MINIMUM = $5
    if (!amountValue || amountValue < 5) {
      return res.status(400).json({
        error: "Minimum deposit is $5",
      });
    }

    // ==============================
    // PREVENT DUPLICATE PENDING PAYMENT
    // ==============================
    const existing = await Payment.findOne({
      userId,
      status: {
        $in: ["waiting", "confirming"],
      },
      createdAt: {
        $gt: Date.now() - 10 * 60 * 1000,
      },
    });

    if (existing) {
      return res.json({
        payment_id: existing.paymentId,
        payment_status: existing.status,
        pay_address: existing.address,
        pay_amount: existing.payAmount,
        pay_currency: existing.payCurrency,
      });
    }

    // ==============================
    // CREATE ORDER
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

        // USDT TON
        pay_currency: "usdtton",

        order_id: orderId,
      },
      {
        headers: {
          "x-api-key":
            process.env.NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // ==============================
    // SAVE PAYMENT
    // ==============================
    await Payment.create({
      userId,

      paymentId: data.payment_id,

      orderId,

      amountUSD: amountValue,

      payAmount: data.pay_amount,

      payCurrency: data.pay_currency,

      address: data.pay_address,

      // MANUAL APPROVAL FLOW
      status: "waiting",

      credited: false,
    });

    return res.json({
      payment_id: data.payment_id,
      payment_status: "waiting",
      pay_address: data.pay_address,
      pay_amount: data.pay_amount,
      pay_currency: data.pay_currency,
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
// GET USER PAYMENTS
// ==============================
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      userId: req.user.id,
    }).sort({
      createdAt: -1,
    });

    return res.json(payments);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch payments",
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
      error: "Failed to get status",
    });
  }
};
