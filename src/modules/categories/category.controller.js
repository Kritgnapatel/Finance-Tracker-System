const Category = require("./category.model");
const AppError = require("../../utils/AppError");
const seedCategoriesForUser = require("../../utils/seedCategories");

const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "income" },
  { name: "Freelance", type: "income" },
  { name: "Food", type: "expense" },
  { name: "Transport", type: "expense" },
  { name: "Shopping", type: "expense" },
  { name: "Rent", type: "expense" },
];

const seedMyCategories = async (req, res, next) => {
  try {
    await seedCategoriesForUser(req.user.id);

    res.json({
      success: true,
      message: "Categories seeded successfully",
    });
  } catch (err) {
    next(err);
  }
};
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

    let categories = await Category.findAll({
      where: { userId, isDeleted: false },
      order: [["createdAt", "ASC"]],
    });

    // 🔥 AUTO SEED if empty
    if (categories.length === 0) {
      const seeded = await Category.bulkCreate(
        DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          userId,
        }))
      );

      categories = seeded;
    }

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
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
  seedMyCategories,
};

