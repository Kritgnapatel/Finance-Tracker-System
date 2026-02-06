const { Op, fn, col } = require("sequelize");
const Budget = require("./budget.model");
const Transaction = require("../transactions/transaction.model");
const Category = require("../categories/category.model");
const AppError = require("../../utils/AppError");
const { sendBudgetAlert } = require("../../utils/mailer");

/**
 * CREATE / UPDATE BUDGET (UPSERT)
 */
const upsertBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { categoryId, month, year, limitAmount } = req.body;

    if (!categoryId || !month || !year || !limitAmount) {
      throw new AppError("Missing budget fields", 400);
    }

    const category = await Category.findOne({
      where: { id: categoryId, userId, isDeleted: false },
    });
    if (!category || category.type !== "expense") {
      throw new AppError("Invalid expense category", 400);
    }

    const [budget] = await Budget.upsert(
      {
        userId,
        categoryId,
        month,
        year,
        limitAmount,
        alertSent: false, // reset on update
      },
      { returning: true }
    );

    res.json({ success: true, data: budget });
  } catch (e) {
    next(e);
  }
};

/**
 * CHECK BUDGET (called internally after expense create/update)
 */
const checkBudgetAndNotify = async (userId, categoryId, month, year) => {
  const budget = await Budget.findOne({
    where: { userId, categoryId, month, year },
  });
  if (!budget || budget.alertSent) return;

  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(year, Number(month), 0).getDate();
  const endDate = `${year}-${month}-${lastDay}`;

  const spent = await Transaction.findOne({
    where: {
      userId,
      categoryId,
      type: "expense",
      transactionDate: { [Op.between]: [startDate, endDate] },
    },
    attributes: [[fn("SUM", col("amount")), "total"]],
  });

  const totalSpent = Math.abs(Number(spent?.get("total") || 0));
  if (totalSpent >= Number(budget.limitAmount)) {
    await sendBudgetAlert(userId, categoryId, month, year, totalSpent, budget.limitAmount);
    budget.alertSent = true;
    await budget.save();
  }
};

module.exports = { upsertBudget, checkBudgetAndNotify };
