const { Op, fn, col, literal } = require("sequelize");
const Transaction = require("../transactions/transaction.model");
const Category = require("../categories/category.model");

/**
 * DASHBOARD SUMMARY
 * - totalIncome
 * - totalExpense
 * - savings
 */
const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const totals = await Transaction.findAll({
      where: { userId },
      attributes: [
        "type",
        [fn("SUM", col("amount")), "total"],
      ],
      group: ["type"],
    });

    let totalIncome = 0;
    let totalExpense = 0;

    totals.forEach((row) => {
      const type = row.get("type");
      const total = Number(row.get("total")) || 0;
      if (type === "income") totalIncome = total;
      if (type === "expense") totalExpense = total;
    });

    return res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        savings: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CATEGORY-WISE BREAKDOWN
 */
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const data = await Transaction.findAll({
      where: { userId },
      attributes: [
        "categoryId",
        [fn("SUM", col("amount")), "total"],
      ],
      include: [
        {
          model: Category,
          attributes: ["name", "type"],
        },
      ],
      group: ["categoryId", "Category.id"],
      order: [[literal("total"), "DESC"]],
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * MONTHLY SUMMARY
 * ?month=02&year=2026
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

    // ✅ SAFE DATE STRINGS (POSTGRES FRIENDLY)
    const startDate = `${year}-${month.padStart(2, "0")}-01`;

    // last day of month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.padStart(2, "0")}-${lastDay}`;

    const data = await Transaction.findAll({
      where: {
        userId,
        transactionDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        "type",
        [fn("SUM", col("amount")), "total"],
      ],
      group: ["type"],
    });

    let income = 0;
    let expense = 0;

    data.forEach((row) => {
      if (row.type === "income") income = Number(row.get("total")) || 0;
      if (row.type === "expense") expense = Number(row.get("total")) || 0;
    });

    return res.json({
      success: true,
      data: {
        month,
        year,
        income,
        expense,
        savings: income - expense,
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
