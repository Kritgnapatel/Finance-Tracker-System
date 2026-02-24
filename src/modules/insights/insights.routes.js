const express = require("express");
const router = express.Router();
const protect = require("../../middlewares/auth.middleware");
const { getMonthlyInsights } = require("./insights.controller");

router.get("/monthly", protect, getMonthlyInsights);

module.exports = router;
