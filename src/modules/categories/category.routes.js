const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("./category.controller");

const router = express.Router();

router.post("/", authMiddleware, createCategory);
router.get("/", authMiddleware, getCategories);
router.put("/:id", authMiddleware, updateCategory);
router.delete("/:id", authMiddleware, deleteCategory);

module.exports = router;
