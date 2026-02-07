const express = require("express");
const router = express.Router();

// 🔐 auth middleware (DEFAULT export)
const protect = require("../../middlewares/auth.middleware");

// 🎯 category controllers (NAMED exports)
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("./category.controller");

// CREATE
router.post("/", protect, createCategory);

// LIST
router.get("/", protect, getCategories);

// UPDATE
router.put("/:id", protect, updateCategory);

// DELETE (soft delete)
router.delete("/:id", protect, deleteCategory);

module.exports = router;
