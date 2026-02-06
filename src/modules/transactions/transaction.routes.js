const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} = require("./transaction.controller");

const router = express.Router();

router.post("/", authMiddleware, createTransaction);
router.get("/", authMiddleware, getTransactions);
router.put("/:id", authMiddleware, updateTransaction);
router.delete("/:id", authMiddleware, deleteTransaction);

module.exports = router;
