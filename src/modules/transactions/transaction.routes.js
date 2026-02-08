const express = require("express");
const router = express.Router();

const protect = require("../../middlewares/auth.middleware");
const uploadReceipt = require("../../config/multer");

const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  uploadReceiptToTransaction,
} = require("./transaction.controller");

// =======================
// TRANSACTION ROUTES
// =======================

// CREATE TRANSACTION
router.post("/", protect, createTransaction);

// LIST TRANSACTIONS
router.get("/", protect, getTransactions);

// GET SINGLE TRANSACTION
router.get("/:id", protect, getTransactionById);

// UPDATE TRANSACTION
router.put("/:id", protect, updateTransaction);

// DELETE TRANSACTION
router.delete("/:id", protect, deleteTransaction);

// UPLOAD RECEIPT FOR TRANSACTION
router.post(
  "/:id/receipt",
  protect,
  uploadReceipt.single("receipt"),
  uploadReceiptToTransaction
);

module.exports = router;
