const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  getSummary,
  getCategoryBreakdown,
  getMonthlySummary,
} = require("./dashboard.controller");

const router = express.Router();

router.get("/summary", authMiddleware, getSummary);
router.get("/categories", authMiddleware, getCategoryBreakdown);
router.get("/monthly", authMiddleware, getMonthlySummary);

module.exports = router;
