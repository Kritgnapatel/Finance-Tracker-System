const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  createCategory,
  getCategories,
} = require("./category.controller");

const router = express.Router();

router.post("/", authMiddleware, createCategory);
router.get("/", authMiddleware, getCategories);

module.exports = router;
