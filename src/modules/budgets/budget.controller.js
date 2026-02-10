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

    if (!categoryId || !limitAmount || !month || !year) {
      throw new AppError("Missing budget fields", 400);
    }

    if (Number(limitAmount) <= 0) {
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
        month: String(month).padStart(2, "0"),
        year,
        amount: limitAmount,
        email: user.email,
        notified: false, // 🔥 reset on every save
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
    month = String(month).padStart(2, "0");

    const budget = await Budget.findOne({
      where: { userId, categoryId, month, year },
    });

    if (!budget) return;

    const user = await User.findByPk(userId);
    const category = await Category.findByPk(categoryId);
    if (!user || !category) return;

    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(year, Number(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay}`;

    const totalSpent =
      (await Transaction.sum("amount", {
        where: {
          userId,
          categoryId,
          type: "expense",
          transactionDate: {
            [Op.between]: [startDate, endDate],
          },
        },
      })) || 0;

    const spent = Math.abs(Number(totalSpent));
    const limit = Number(budget.amount);

    console.log("📊 Budget Check:", {
      user: user.email,
      category: category.name,
      spent,
      limit,
      month,
      year,
    });

    // 🔥 FINAL FIX: REMOVE notified BLOCK
    if (spent >= limit) {
      await sendEmail({
        to: user.email,
        subject: "⚠️ Budget Limit Exceeded",
        text: `
Hi ${user.name},

Your monthly budget limit has been exceeded.

Category: ${category.name}
Limit: ₹${limit}
Spent: ₹${spent}

— Finance Tracker
        `,
      });

      console.log("📧 Budget alert email sent to:", user.email);
    }

    console.log("📧 Budget check completed");
  } catch (err) {
    console.error("❌ Budget notify error:", err.message);
  }
};


module.exports = {
  upsertBudget,
  checkBudgetAndNotify,
};
