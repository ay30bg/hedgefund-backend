// const express = require("express");
// const router = express.Router();

// const {
//   getUsers,
//   updateUser,
//   toggleBanUser,
//   deleteUser,
// } = require("../controllers/adminUserController");

// const {
//   protect,
//   adminOnly,
// } = require("../middleware/adminAuthMiddleware");

// // ================= ADMIN ROUTES =================
// router.get(
//   "/users",
//   protect,
//   adminOnly,
//   getUsers
// );

// router.put(
//   "/users/:id",
//   protect,
//   adminOnly,
//   updateUser
// );

// router.put(
//   "/users/:id/toggle-ban",
//   protect,
//   adminOnly,
//   toggleBanUser
// );

// router.delete(
//   "/users/:id",
//   protect,
//   adminOnly,
//   deleteUser
// );

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUserStats,
  updateUser,
  toggleBanUser,
  deleteUser,
} = require("../controllers/adminUserController");

const {
  protect,
  adminOnly,
} = require("../middleware/adminAuthMiddleware");

// ================= GET ALL USERS =================
router.get(
  "/users",
  protect,
  adminOnly,
  getUsers
);

// ================= GET USER STATS =================
router.get(
  "/users/:id/stats",
  protect,
  adminOnly,
  getUserStats
);

// ================= UPDATE USER =================
router.put(
  "/users/:id",
  protect,
  adminOnly,
  updateUser
);

// ================= TOGGLE BAN =================
router.put(
  "/users/:id/toggle-ban",
  protect,
  adminOnly,
  toggleBanUser
);

// ================= DELETE USER =================
router.delete(
  "/users/:id",
  protect,
  adminOnly,
  deleteUser
);

module.exports = router;
