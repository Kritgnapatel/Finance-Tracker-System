const { Op } = require("sequelize"); // ✅ VERY IMPORTANT
const Transaction = require("./transaction.model");
const Category = require("../categories/category.model");
const AppError = require("../../utils/AppError");

/**
 * CREATE TRANSACTION
 */
const createTransaction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      categoryId,
      type,
      amount,
      currency = "INR",
      description,
      transactionDate,
    } = req.body;

    // Basic validation
    if (!categoryId || !type || amount === undefined || !transactionDate) {
      throw new AppError("Missing required transaction fields", 400);
    }

    if (!["income", "expense"].includes(type)) {
      throw new AppError("Invalid transaction type", 400);
    }

    // Amount validation
    if (Number(amount) === 0) {
      throw new AppError("Amount cannot be zero", 400);
    }

    // Check category ownership + soft delete
    const category = await Category.findOne({
      where: {
        id: categoryId,
        userId,
        isDeleted: false,
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    // Category type must match transaction type
    if (category.type !== type) {
      throw new AppError(
        "Transaction type does not match category type",
        400
      );
    }

    const transaction = await Transaction.create({
      userId,
      categoryId,
      type,
      amount,
      currency,
      description,
      transactionDate,
    });

    return res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * LIST TRANSACTIONS (WITH FILTERS)
 */
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, categoryId, type } = req.query;

    const where = { userId };

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filter by type
    if (type) {
      if (!["income", "expense"].includes(type)) {
        throw new AppError("Invalid transaction type filter", 400);
      }
      where.type = type;
    }

    // ✅ DATE RANGE FILTER (CORRECT SEQUELIZE WAY)
    if (startDate && endDate) {
      where.transactionDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    const transactions = await Transaction.findAll({
      where,
      order: [["transactionDate", "DESC"]],
    });

    return res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
};
