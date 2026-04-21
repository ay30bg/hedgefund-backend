const express = require("express");
const router = express.Router();

const { getMachines } = require("../controllers/machineController");

router.get("/", getMachines);

module.exports = router;
