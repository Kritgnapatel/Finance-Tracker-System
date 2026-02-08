const express = require("express");
const router = express.Router();

const protect = require("../../middlewares/auth.middleware");
const {
  getMe,
  updateMe,
  updatePreferredCurrency,
} = require("./user.controller");

// 🔐 Get current user
router.get("/me", protect, getMe);

// ✏️ Update name / email
router.put("/me", protect, updateMe);

// 💱 Update preferred currency
router.put("/currency", protect, updatePreferredCurrency);

module.exports = router;
