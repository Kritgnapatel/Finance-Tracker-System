const express = require("express");
const router = express.Router();
const protect = require("../../middlewares/auth.middleware");

const {
  addFriend,
  removeFriend,
  getFriends,
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  createSettlement,
  getSettlements,
  getDashboard,
} = require("./payflow.controller");

// =====================
// FRIENDS
// =====================
router.post("/friends", protect, addFriend);
router.delete("/friends/:friendId", protect, removeFriend);
router.get("/friends", protect, getFriends);

// =====================
// EXPENSES
// =====================
router.post("/expenses", protect, createExpense);
router.get("/expenses", protect, getExpenses);
router.get("/expenses/:id", protect, getExpenseById);
router.put("/expenses/:id", protect, updateExpense);
router.delete("/expenses/:id", protect, deleteExpense);

// =====================
// SETTLEMENTS
// =====================
router.post("/settlements", protect, createSettlement);
router.get("/settlements", protect, getSettlements);

// =====================
// DASHBOARD SUMMARY
// =====================
router.get("/dashboard", protect, getDashboard);

module.exports = router;
