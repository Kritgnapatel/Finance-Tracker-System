const { Op } = require("sequelize");
const Transaction = require("./transaction.model");
const Category = require("../categories/category.model");
const AppError = require("../../utils/AppError");
const { checkBudgetAndNotify } = require("../budgets/budget.controller");
const { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } = require("../../constants/currencies");
const User = require("../users/user.model");

/**
 * CREATE TRANSACTION
 */
const uploadReceiptToTransaction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!req.file) {
      throw new AppError("Receipt file is required", 400);
    }

    const transaction = await Transaction.findOne({
      where: { id, userId },
    });

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    transaction.receiptUrl = `/uploads/receipts/${req.file.filename}`;
    await transaction.save();

    res.json({
      success: true,
      message: "Receipt uploaded successfully",
      data: {
        transactionId: transaction.id,
        receiptUrl: transaction.receiptUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      categoryId,
      type,
      amount,
      currency, // ❗ no default here
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

    // 🔥 get user preferred currency
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const finalCurrency = currency || user.preferredCurrency;

    // Category check
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

    if (category.type !== type) {
      throw new AppError("Transaction type does not match category type", 400);
    }

    const transaction = await Transaction.create({
      userId,
      categoryId,
      type,
      amount,
      currency: finalCurrency, // ✅ FIXED
      description,
      transactionDate,
    });

    // budget check
    if (type === "expense") {
      const dateObj = new Date(transactionDate);
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = String(dateObj.getFullYear());
      await checkBudgetAndNotify(userId, categoryId, month, year);
    }

    res.status(201).json({
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

    // 🔔 Budget check again (ONLY if expense)
    if (transaction.type === "expense") {
      const dateObj = new Date(transaction.transactionDate);
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = String(dateObj.getFullYear());

      await checkBudgetAndNotify(
        userId,
        transaction.categoryId,
        month,
        year
      );
    }

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

const getTransactionById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadReceiptToTransaction,
  createTransaction,
  getTransactions,
  getTransactionById, // 👈 ADD
  updateTransaction,
  deleteTransaction,
};
