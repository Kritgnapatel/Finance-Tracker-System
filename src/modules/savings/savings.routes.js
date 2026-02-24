const express = require("express");
const router = express.Router();
const protect = require("../../middlewares/auth.middleware");
const { addSavingsGoal, getSavingsGoals, updateSavingsGoal, deleteSavingsGoal } = require("./savings.controller");

router.post("/", protect, addSavingsGoal);
router.get("/", protect, getSavingsGoals);
router.put("/:id", protect, updateSavingsGoal);
router.delete("/:id", protect, deleteSavingsGoal);

module.exports = router;
