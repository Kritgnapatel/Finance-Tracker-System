const { Op } = require("sequelize");
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

    if (!categoryId || !type || amount === undefined || !transactionDate) {
      throw new AppError("Missing required transaction fields", 400);
    }

    if (!["income", "expense"].includes(type)) {
      throw new AppError("Invalid transaction type", 400);
    }

    if (Number(amount) === 0) {
      throw new AppError("Amount cannot be zero", 400);
    }

    const category = await Category.findOne({
      where: { id: categoryId, userId, isDeleted: false },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    if (category.type !== type) {
      throw new AppError("Transaction type mismatch with category", 400);
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
 * LIST TRANSACTIONS
 */
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, categoryId, type } = req.query;

    const where = { userId };

    if (categoryId) where.categoryId = categoryId;

    if (type) {
      if (!["income", "expense"].includes(type)) {
        throw new AppError("Invalid transaction type filter", 400);
      }
      where.type = type;
    }

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

/**
 * UPDATE TRANSACTION
 */
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount, description, transactionDate } = req.body;

    const transaction = await Transaction.findOne({
      where: { id, userId },
    });

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    if (amount !== undefined && Number(amount) === 0) {
      throw new AppError("Amount cannot be zero", 400);
    }

    if (amount !== undefined) transaction.amount = amount;
    if (description !== undefined) transaction.description = description;
    if (transactionDate !== undefined)
      transaction.transactionDate = transactionDate;

    await transaction.save();

    return res.json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE TRANSACTION
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({
      where: { id, userId },
    });

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    await transaction.destroy();

    return res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
