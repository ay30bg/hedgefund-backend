const express = require("express");
const router = express.Router();

const {
  getUsers,
  updateUser,
  toggleBanUser,
  deleteUser,
} = require("../controllers/adminController");

// ================= USERS =================
router.get("/users", getUsers);

router.put("/users/:id", updateUser);

router.put("/users/:id/toggle-ban", toggleBanUser);

router.delete("/users/:id", deleteUser);

module.exports = router;
