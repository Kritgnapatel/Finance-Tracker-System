const { Op, fn, col, literal } = require("sequelize");
const Transaction = require("../transactions/transaction.model");
const Category = require("../categories/category.model");
const User = require("../users/user.model");
const { convertAmount } = require("../../utils/currency");

/**
 * DASHBOARD SUMMARY
 * - totalIncome
 * - totalExpense
 * - savings
 * (converted to user's preferred currency)
 */
const getSummary = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const targetCurrency = user.preferredCurrency || "INR";

    const rows = await Transaction.findAll({
      where: { userId: req.user.id },
      attributes: ["type", "amount", "currency"],
    });

    let totalIncome = 0;
    let totalExpense = 0;

    rows.forEach((t) => {
      const converted = convertAmount(t.amount, t.currency, targetCurrency);
      if (t.type === "income") totalIncome += converted;
      if (t.type === "expense") totalExpense += converted;
    });

    res.json({
      success: true,
      data: {
        currency: targetCurrency,
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpense: Number(totalExpense.toFixed(2)),
        savings: Number((totalIncome - totalExpense).toFixed(2)),
      },
    });
  } catch (e) {
    next(e);
  }
};
/**
 * CATEGORY-WISE BREAKDOWN
 * (converted to user's preferred currency)
 */
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    const targetCurrency = user.preferredCurrency;

    const rows = await Transaction.findAll({
      where: { userId },
      attributes: ["amount", "currency"],
      include: [
        {
          model: Category,
          attributes: ["id", "name", "type"],
        },
      ],
    });

    const result = {};

    rows.forEach((t) => {
      const key = t.Category.id;
      const converted = convertAmount(
        t.amount,
        t.currency,
        targetCurrency
      );

      if (!result[key]) {
        result[key] = {
          categoryId: t.Category.id,
          name: t.Category.name,
          type: t.Category.type,
          total: 0,
        };
      }

      result[key].total += converted;
    });

    return res.json({
      success: true,
      currency: targetCurrency,
      data: Object.values(result).map((r) => ({
        ...r,
        total: Number(r.total.toFixed(2)),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * MONTHLY SUMMARY
 * ?month=02&year=2026
 * (converted to user's preferred currency)
 */
const getMonthlySummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    const user = await User.findByPk(userId);
    const targetCurrency = user.preferredCurrency;

    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.padStart(2, "0")}-${lastDay}`;

    const rows = await Transaction.findAll({
      where: {
        userId,
        transactionDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: ["type", "amount", "currency"],
    });

    let income = 0;
    let expense = 0;

    rows.forEach((t) => {
      const converted = convertAmount(
        t.amount,
        t.currency,
        targetCurrency
      );

      if (t.type === "income") income += converted;
      if (t.type === "expense") expense += converted;
    });

    return res.json({
      success: true,
      data: {
        month,
        year,
        currency: targetCurrency,
        income: Number(income.toFixed(2)),
        expense: Number(expense.toFixed(2)),
        savings: Number((income - expense).toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlySummary,
};
