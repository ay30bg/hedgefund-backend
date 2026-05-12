const express = require("express");
const router = express.Router();

const {
  getUsers,
  updateUser,
  toggleBanUser,
  deleteUser,
} = require("../controllers/adminController");

const {
  protect,
  adminOnly,
} = require("../middleware/adminAuthMiddleware");

// ================= ADMIN ROUTES =================
router.get(
  "/users",
  protect,
  adminOnly,
  getUsers
);

router.put(
  "/users/:id",
  protect,
  adminOnly,
  updateUser
);

router.put(
  "/users/:id/toggle-ban",
  protect,
  adminOnly,
  toggleBanUser
);

router.delete(
  "/users/:id",
  protect,
  adminOnly,
  deleteUser
);

module.exports = router;
