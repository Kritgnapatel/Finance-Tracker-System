const express = require("express");
const router = express.Router();

const protect = require("../../middlewares/auth.middleware");
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require("./transaction.controller");

// CREATE
router.post("/", protect, createTransaction);

// LIST
router.get("/", protect, getTransactions);

// GET SINGLE
router.get("/:id", protect, getTransactionById);

// UPDATE
router.put("/:id", protect, updateTransaction);

// DELETE
router.delete("/:id", protect, deleteTransaction);

module.exports = router;
