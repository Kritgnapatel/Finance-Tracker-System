const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const { getMe, updateMe } = require("./user.controller");

const router = express.Router();

router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);

module.exports = router;
