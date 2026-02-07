const { Op } = require("sequelize");
const Budget = require("./budget.model");
const Transaction = require("../transactions/transaction.model");
const Category = require("../categories/category.model");
const sendEmail = require("../../utils/sendEmail");

const checkBudgetAndNotify = async (userId, categoryId, month, year) => {
  const budget = await Budget.findOne({
    where: { userId, categoryId, month, year },
  });

  if (!budget) return;

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

  if (Math.abs(totalSpent || 0) >= budget.amount && !budget.notified) {
    const category = await Category.findByPk(categoryId);

    await sendEmail({
      to: budget.email,
      subject: "⚠️ Budget Limit Exceeded",
      text: `
Hi,

Your budget for category "${category.name}" has been exceeded.

Budget Limit: ₹${budget.amount}
Total Spent: ₹${Math.abs(totalSpent)}

Please review your expenses.

— Finance Tracker
`,
    });

    budget.notified = true;
    await budget.save();
  }
};

module.exports = { checkBudgetAndNotify };
