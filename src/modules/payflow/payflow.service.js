const { Op } = require("sequelize");
const PayflowParticipant = require("./payflow_participant.model");
const PayflowExpense = require("./payflow_expense.model");
const PayflowSettlement = require("./payflow_settlement.model");

/**
 * PAYFLOW SERVICE
 *
 * Core balance calculation logic. All monetary values are in INR.
 *
 * Balance interpretation for getBalanceBetween(userA, userB):
 *   positive → userA OWES userB
 *   negative → userB OWES userA
 */

/**
 * Returns the net balance that userA owes userB.
 * Positive = A owes B; Negative = B owes A (i.e., B owes A |result|).
 *
 * Calculation:
 *   amountAOwesB = Σ participant.share WHERE expense.paidByUserId=B
 *                                       AND participant.userId=A
 *                                       AND status='pending'
 *
 *   amountBOwesA = Σ participant.share WHERE expense.paidByUserId=A
 *                                       AND participant.userId=B
 *                                       AND status='pending'
 *
 *   netBalance = amountAOwesB - amountBOwesA
 */
const getBalanceBetween = async (userAId, userBId) => {
  // Expenses paid by B where A is a pending participant
  const expensesPaidByB = await PayflowExpense.findAll({
    where: { paidByUserId: userBId },
    attributes: ["id"],
  });

  const expenseIdsPaidByB = expensesPaidByB.map((e) => e.id);

  let amountAOwesB = 0;
  if (expenseIdsPaidByB.length > 0) {
    const rows = await PayflowParticipant.findAll({
      where: {
        expenseId: { [Op.in]: expenseIdsPaidByB },
        userId: userAId,
        status: "pending",
      },
      attributes: ["share"],
    });
    amountAOwesB = rows.reduce((sum, r) => sum + Number(r.share), 0);
  }

  // Expenses paid by A where B is a pending participant
  const expensesPaidByA = await PayflowExpense.findAll({
    where: { paidByUserId: userAId },
    attributes: ["id"],
  });

  const expenseIdsPaidByA = expensesPaidByA.map((e) => e.id);

  let amountBOwesA = 0;
  if (expenseIdsPaidByA.length > 0) {
    const rows = await PayflowParticipant.findAll({
      where: {
        expenseId: { [Op.in]: expenseIdsPaidByA },
        userId: userBId,
        status: "pending",
      },
      attributes: ["share"],
    });
    amountBOwesA = rows.reduce((sum, r) => sum + Number(r.share), 0);
  }

  // Net: positive means A owes B
  return Number((amountAOwesB - amountBOwesA).toFixed(2));
};

/**
 * Returns dashboard-level summary for a user:
 *   totalOwed     — sum of all pending shares the user owes to others
 *   totalOwedToMe — sum of all pending shares others owe to the user
 *   pendingCount  — number of distinct pending participant rows for the user
 */
const getDashboardSummary = async (userId) => {
  // Get all expenses where someone else paid (not me)
  const othersExpenses = await PayflowExpense.findAll({
    where: { paidByUserId: { [Op.ne]: userId } },
    attributes: ["id"],
  });
  const othersExpenseIds = othersExpenses.map((e) => e.id);

  // What this user owes: their pending participant rows in expenses paid by others
  let totalOwed = 0;
  let pendingOwedCount = 0;
  if (othersExpenseIds.length > 0) {
    const myPendingShares = await PayflowParticipant.findAll({
      where: {
        expenseId: { [Op.in]: othersExpenseIds },
        userId,
        status: "pending",
      },
      attributes: ["share"],
    });
    totalOwed = myPendingShares.reduce((sum, r) => sum + Number(r.share), 0);
    pendingOwedCount = myPendingShares.length;
  }

  // What others owe me: pending participant rows in expenses I paid
  const myExpenses = await PayflowExpense.findAll({
    where: { paidByUserId: userId },
    attributes: ["id"],
  });
  const myExpenseIds = myExpenses.map((e) => e.id);

  let totalOwedToMe = 0;
  let pendingOwedToMeCount = 0;
  if (myExpenseIds.length > 0) {
    const owedRows = await PayflowParticipant.findAll({
      where: {
        expenseId: { [Op.in]: myExpenseIds },
        userId: { [Op.ne]: userId },
        status: "pending",
      },
      attributes: ["share"],
    });
    totalOwedToMe = owedRows.reduce((sum, r) => sum + Number(r.share), 0);
    pendingOwedToMeCount = owedRows.length;
  }

  return {
    totalOwed: Number(totalOwed.toFixed(2)),
    totalOwedToMe: Number(totalOwedToMe.toFixed(2)),
    pendingCount: pendingOwedCount + pendingOwedToMeCount,
  };
};

module.exports = {
  getBalanceBetween,
  getDashboardSummary,
};
