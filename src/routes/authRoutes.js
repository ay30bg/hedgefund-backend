// const express = require("express");
// const router = express.Router();
// const {
//   signup,
//   login,
//   forgotPassword,
//   resetPassword
// } = require("../controllers/authController");

// // ================= AUTH ROUTES =================
// router.post("/signup", signup);
// router.post("/login", login);

// // ================= PASSWORD RESET =================
// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password/:token", resetPassword);

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);

router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
