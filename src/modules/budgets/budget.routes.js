const express = require("express");
const auth = require("../../middlewares/auth.middleware");
const { upsertBudget } = require("./budget.controller");

const router = express.Router();
router.post("/", auth, upsertBudget);
module.exports = router;
