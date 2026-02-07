const { Op } = require("sequelize");
const Budget = require("./budget.model");
const Transaction = require("../transactions/transaction.model");
const Category = require("../categories/category.model");
const AppError = require("../../utils/AppError");
const sendEmail = require("../../utils/sendEmail");

/**
 * CREATE / UPDATE BUDGET (UPSERT)
 */
const upsertBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { categoryId, amount, month, year, email } = req.body;

    if (!categoryId || !amount || !month || !year || !email) {
      throw new AppError("Missing budget fields", 400);
    }

    if (Number(amount) <= 0) {
      throw new AppError("Budget amount must be greater than zero", 400);
    }

    const category = await Category.findOne({
      where: { id: categoryId, userId, isDeleted: false },
    });

    if (!category || category.type !== "expense") {
      throw new AppError("Invalid expense category", 400);
    }

    const [budget, created] = await Budget.findOrCreate({
      where: { userId, categoryId, month, year },
      defaults: { amount, email },
    });

    if (!created) {
      budget.amount = amount;
      budget.email = email;
      budget.notified = false; // reset alert
      await budget.save();
    }

    res.status(created ? 201 : 200).json({
      success: true,
      message: created
        ? "Budget created successfully"
        : "Budget updated successfully",
      data: budget,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * INTERNAL — CHECK BUDGET + SEND EMAIL
 */
const checkBudgetAndNotify = async (userId, categoryId, month, year) => {
  const budget = await Budget.findOne({
    where: { userId, categoryId, month, year },
  });

  if (!budget || budget.notified) return;

  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const totalSpent = await Transaction.sum("amount", {
    where: {
      userId,
      categoryId,
      type: "expense",
      transactionDate: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
  });

  if (Math.abs(totalSpent || 0) >= Number(budget.amount)) {
    await sendEmail({
      to: budget.email,
      subject: "⚠️ Budget Limit Exceeded",
      text: `
Hi,

Your budget for this category has been exceeded.

Budget: ₹${budget.amount}
Spent: ₹${Math.abs(totalSpent)}

— Finance Tracker
`,
    });

    budget.notified = true;
    await budget.save();
  }
};

module.exports = {
  upsertBudget,
  checkBudgetAndNotify,
};
