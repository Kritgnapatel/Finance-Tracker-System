const express = require("express");
const protect = require("../../middlewares/auth.middleware");

// 🔥 CONTROLLER IMPORT — THIS MUST MATCH EXACT EXPORT
const {
  getMe,
  updateMe,
} = require("./user.controller");

const router = express.Router();

// PROFILE
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

// 🔥 CURRENCY ROUTE (THIS WAS BREAKING)

module.exports = router;
