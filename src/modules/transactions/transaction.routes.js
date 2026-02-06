const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  createTransaction,
  getTransactions,
} = require("./transaction.controller");

const router = express.Router();

router.post("/", authMiddleware, createTransaction);
router.get("/", authMiddleware, getTransactions);

module.exports = router;
