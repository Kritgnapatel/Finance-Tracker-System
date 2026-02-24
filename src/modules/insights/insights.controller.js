const { Op } = require("sequelize");
const Transaction = require("../transactions/transaction.model");

exports.getMonthlyInsights = async (req, res, next) => {
    try {
        const { month, year } = req.query; // format MM, YYYY
        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        const startDate = new Date(`${year}-${month}-01`);
        // End date is exactly end of the month
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);

        // Get transactions for the month
        const transactions = await Transaction.findAll({
            where: {
                userId: req.user.id,
                transactionDate: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        let totalExpense = 0;
        let totalIncome = 0;
        const categorySpend = {}; // mapped by categoryId for simplicity

        transactions.forEach(t => {
            const amt = parseFloat(t.amount);
            if (t.type === 'expense') {
                totalExpense += amt;
                const catId = t.categoryId || 'uncategorized';
                categorySpend[catId] = (categorySpend[catId] || 0) + amt;
            } else {
                totalIncome += amt;
            }
        });



        // Identify highest spending category ID
        let highestCategoryAmount = 0;
        let highestCategoryId = null;

        for (const [catId, amt] of Object.entries(categorySpend)) {
            if (amt > highestCategoryAmount) {
                highestCategoryAmount = amt;
                highestCategoryId = catId;
            }
        }

        const daysInMonth = endDate.getDate();
        const averageDailySpend = totalExpense / daysInMonth;

        res.json({
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            averageDailySpend,
            highestCategoryAmount,
            highestCategoryId,
            categories: categorySpend
        });

    } catch (error) {
        next(error);
    }
};
