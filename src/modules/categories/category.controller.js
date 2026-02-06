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
/**
 * UPDATE CATEGORY
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      throw new AppError("Category name is required", 400);
    }

    const category = await Category.findOne({
      where: {
        id,
        userId,
        isDeleted: false,
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    category.name = name;
    await category.save();

    return res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SOFT DELETE CATEGORY
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const category = await Category.findOne({
      where: {
        id,
        userId,
        isDeleted: false,
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    category.isDeleted = true;
    await category.save();

    return res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};

