const router = require("express").Router();
const ctrl = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

router.get("/profile", auth, ctrl.getProfile);
router.post("/bind-wallet", auth, ctrl.bindWallet);
router.post("/set-withdrawal-password", auth, ctrl.setWithdrawalPassword);

module.exports = router;
