const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  createInvestment,
  getInvestments,
  deleteInvestment,
} = require("./investment.controller");

const router = express.Router();

router.post("/", authMiddleware, createInvestment);
router.get("/", authMiddleware, getInvestments);
router.delete("/:id", authMiddleware, deleteInvestment);

module.exports = router;
