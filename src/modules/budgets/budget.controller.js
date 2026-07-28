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
    const formattedMonth = String(month).padStart(2, "0");
    const formattedYear = String(year);

    const budget = await Budget.findOne({
      where: { userId, categoryId, month: formattedMonth, year: formattedYear },
    });

    if (!budget) return;

    const user = await User.findByPk(userId);
    const category = await Category.findByPk(categoryId);
    if (!user || !category) return;

    // 🔥 ALWAYS send to the currently logged in user's email
    const recipientEmail = user.email || budget.email;
    if (!recipientEmail) {
      console.error("❌ Budget alert skipped: No email found for user ID:", userId);
      return;
    }

    // Date range calculation for full month
    const startDate = `${formattedYear}-${formattedMonth}-01`;
    const lastDayNum = new Date(Number(formattedYear), Number(formattedMonth), 0).getDate();
    const endDate = `${formattedYear}-${formattedMonth}-${String(lastDayNum).padStart(2, "0")}`;

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
      userId,
      userEmail: user.email,
      category: category.name,
      spent,
      limit,
      month: formattedMonth,
      year: formattedYear,
      notified: budget.notified,
    });

    if (spent >= limit) {
      if (!budget.notified) {
        const currencySymbol = user.preferredCurrency === "USD" ? "$" : "₹";
        const formattedLimit = `${currencySymbol}${limit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const formattedSpent = `${currencySymbol}${spent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const formattedExceeded = `${currencySymbol}${(spent - limit).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const plainText = `Hi ${user.name || "User"},

⚠️ Budget Limit Exceeded Alert!

Your monthly budget for "${category.name}" has been exceeded for ${formattedMonth}/${formattedYear}.

Category: ${category.name}
Budget Limit: ${formattedLimit}
Total Spent: ${formattedSpent}
Exceeded Amount: ${formattedExceeded}

Please log in to FiscalFlow to manage your budget and review your expenses.

Note: If this message landed in your Spam or Promotions folder, please mark it as "Not Spam" or move it to your Primary Inbox to receive future notifications instantly.

— FiscalFlow Team`;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Exceeded Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 24px; text-align: center;">
              <div style="font-size: 42px; margin-bottom: 8px;">⚠️</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Budget Limit Exceeded</h1>
              <p style="color: #fee2e2; margin: 6px 0 0 0; font-size: 14px;">FiscalFlow Real-time Financial Alert</p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-top: 0;">
                Hello <strong>${user.name || "User"}</strong>,
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Your total expenses for <strong style="color: #38bdf8;">${category.name}</strong> have crossed your set budget limit for <strong>${formattedMonth}/${formattedYear}</strong>.
              </p>

              <!-- Stats Card -->
              <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin: 24px 0;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Category</td>
                    <td style="padding: 10px 0; color: #f8fafc; font-size: 15px; font-weight: 600; text-align: right;">${category.name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Budget Limit</td>
                    <td style="padding: 10px 0; color: #38bdf8; font-size: 15px; font-weight: 600; text-align: right;">${formattedLimit}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Total Spent</td>
                    <td style="padding: 10px 0; color: #f43f5e; font-size: 15px; font-weight: 600; text-align: right;">${formattedSpent}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Amount Exceeded</td>
                    <td style="padding: 10px 0; text-align: right;">
                      <span style="background-color: #450a0a; color: #fca5a5; font-size: 14px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #991b1b;">+${formattedExceeded}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Recommendation Box -->
              <div style="background-color: #1e1b4b; border-left: 4px solid #6366f1; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #c7d2fe; line-height: 1.5;">
                  💡 <strong>Tip:</strong> Review your recent transactions or adjust your budget limits from your FiscalFlow dashboard.
                </p>
              </div>

              <!-- Important Delivery Notice -->
              <div style="background-color: #0f172a; padding: 12px 14px; border-radius: 8px; border: 1px dashed #475569; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.4; text-align: center;">
                  📩 <strong>Inbox Tip:</strong> If this email appeared in your <strong>Spam</strong> or <strong>Promotions</strong> folder, please mark it as <em>"Not Spam"</em> or move it to your <strong>Primary Inbox</strong>.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">Sent with ❤️ by <strong>FiscalFlow</strong> Personal Finance Manager</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const result = await sendEmail({
          to: recipientEmail,
          subject: `⚠️ Budget Exceeded: ${category.name}`,
          text: plainText,
          html: htmlContent,
        });

        if (result && result.success) {
          budget.notified = true;
          await budget.save();
          console.log(`📧 Budget alert email sent successfully to: ${recipientEmail}`);
        } else {
          console.error(`❌ Failed to send budget alert email to: ${recipientEmail}`, result?.error);
        }
      } else {
        console.log(`ℹ️ Budget alert email already sent for this month (${formattedMonth}/${formattedYear}), skipping repeat notification.`);
      }
    } else {
      // If expenses were deleted or edited and spent dropped below limit, reset notified flag
      if (budget.notified) {
        budget.notified = false;
        await budget.save();
        console.log(`🔄 Budget spent dropped below limit for category: ${category.name}. Reset notified flag.`);
      }
    }
  } catch (err) {
    console.error("❌ Budget notify error:", err.message);
  }
};


module.exports = {
  upsertBudget,
  checkBudgetAndNotify,
};
