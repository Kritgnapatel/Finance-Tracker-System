const express = require("express");
const { register, login } = require("./auth.controller");
const passport = require("../../config/passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

/* ===================== GOOGLE LOGIN ===================== */

// STEP 1: redirect to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// STEP 2: Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { sub: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const frontendURL =
      process.env.FRONTEND_URL || "http://localhost:5000";

    res.redirect(
      `${frontendURL}/dashboard.html?token=${token}`
    );
  }
);

/* ===================== EMAIL/PASSWORD ===================== */
router.post("/register", register);
router.post("/login", login);

module.exports = router;
