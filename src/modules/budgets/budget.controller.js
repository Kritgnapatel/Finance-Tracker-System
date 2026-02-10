const { Op } = require("sequelize");
const Budget = require("./budget.model");
const Transaction = require("../transactions/transaction.model");
const Category = require("../categories/category.model");
const User = require("../users/user.model");
const AppError = require("../../utils/AppError");
const sendEmail = require("../../utils/sendEmail");

/**
 * CREATE / UPDATE BUDGET
 */
const upsertBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { categoryId, limitAmount, month, year } = req.body;
    const amount = limitAmount;

    if (!categoryId || amount === undefined || !month || !year) {
      throw new AppError("Missing budget fields", 400);
    }

    if (Number(amount) <= 0) {
      throw new AppError("Budget amount must be greater than zero", 400);
    }

    const category = await Category.findOne({
      where: { id: categoryId, userId, type: "expense", isDeleted: false },
    });

    if (!category) {
      throw new AppError("Invalid expense category", 400);
    }

    const user = await User.findByPk(userId);
    if (!user?.email) {
      throw new AppError("User email not found", 400);
    }

    const [budget] = await Budget.upsert(
      {
        userId,
        categoryId,
        month,
        year,
        amount,
        email: user.email,
        notified: false,
      },
      { returning: true }
    );

    res.json({
      success: true,
      message: "Budget saved successfully",
      data: budget,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 🔔 CHECK BUDGET & SEND EMAIL
 */
const checkBudgetAndNotify = async (userId, categoryId, month, year) => {
  try {
    const budget = await Budget.findOne({
      where: { userId, categoryId, month, year },
    });

    if (!budget || budget.notified) return;

    const user = await User.findByPk(userId);
    const category = await Category.findByPk(categoryId);
    if (!user || !category) return;

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

    const spent = Math.abs(totalSpent || 0);

    console.log("📊 Budget Check:", {
      category: category.name,
      spent,
      limit: budget.amount,
    });

    if (spent >= budget.amount) {
      await sendEmail({
        to: budget.email,
        subject: "⚠️ Budget Limit Exceeded",
        text: `
Hi ${user.name},

Your monthly budget limit has been exceeded.

Category: ${category.name}
Limit: ₹${budget.amount}
Spent: ₹${spent}

— Finance Tracker
        `,
      });

      budget.notified = true;
      await budget.save();
    }
  } catch (err) {
    console.error("❌ Budget notify error:", err.message);
  }
};



module.exports = {
  upsertBudget,
  checkBudgetAndNotify,
};
