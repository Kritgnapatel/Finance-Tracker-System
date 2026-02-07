const express = require("express");
const { register, login } = require("./auth.controller");
const passport = require("../../config/passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// GOOGLE CALLBACK
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { sub: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      message: "Google login successful",
      token,
    });
  }
);

router.post("/register", register);
router.post("/login", login);

module.exports = router;
