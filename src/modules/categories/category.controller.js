const Category = require("./category.model");
const AppError = require("../../utils/AppError");

/**
 * CREATE CATEGORY
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, type } = req.body;
    const userId = req.user.id;

    if (!name || !type) {
      throw new AppError("Category name and type are required", 400);
    }

    if (!["income", "expense"].includes(type)) {
      throw new AppError("Invalid category type", 400);
    }

    const category = await Category.create({
      name,
      type,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL CATEGORIES (USER SPECIFIC)
 */
const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const categories = await Category.findAll({
      where: {
        userId,
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
};
