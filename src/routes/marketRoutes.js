// const express = require("express");
// const router = express.Router();

// const {
//   buyMachine,
//   getUserMachines,
//   updateExpiredMachines,
// } = require("../controllers/marketController");

// const { protect } = require("../middleware/authMiddleware");

// // =======================
// // 🔒 BUY MACHINE (SECURE)
// // =======================
// router.post("/", protect, buyMachine);

// // =======================
// // 🔒 GET LOGGED-IN USER MACHINES ONLY
// // =======================
// router.get("/user", protect, getUserMachines);

// // =======================
// // (OPTIONAL) ADMIN / CRON JOB
// // =======================
// router.patch("/expire/update", updateExpiredMachines);

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  buyMachine,
  getUserMachines,
  updateExpiredMachines,
  claimMachine,
} = require("../controllers/marketController");

const { protect } = require("../middleware/authMiddleware");

// =======================
// 🔒 BUY MACHINE
// =======================
router.post("/", protect, buyMachine);

// =======================
// 🔒 GET USER MACHINES
// =======================
router.get("/user", protect, getUserMachines);

// =======================
// 🔒 CLAIM MACHINE
// =======================
router.post("/claim/:id", protect, claimMachine);

// =======================
// (OPTIONAL) ADMIN / CRON
// =======================
router.patch("/expire/update", updateExpiredMachines);

module.exports = router;
