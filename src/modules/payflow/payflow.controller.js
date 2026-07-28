const { Op } = require("sequelize");
const AppError = require("../../utils/AppError");
const User = require("../users/user.model");
const PayflowFriend = require("./payflow_friend.model");
const PayflowExpense = require("./payflow_expense.model");
const PayflowParticipant = require("./payflow_participant.model");
const PayflowSettlement = require("./payflow_settlement.model");
const { getBalanceBetween, getDashboardSummary } = require("./payflow.service");

// ============================================================
// FRIENDS
// ============================================================

/**
 * POST /api/payflow/friends
 * Body: { email }
 * Adds a registered user as a friend (bidirectional).
 */
const addFriend = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    if (!email) throw new AppError("Friend email is required", 400);

    // Find the friend by email
    const friend = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!friend) throw new AppError("No user found with that email", 404);
    if (friend.id === userId) throw new AppError("You cannot add yourself as a friend", 400);

    // Check if already friends
    const existing = await PayflowFriend.findOne({
      where: { userId, friendId: friend.id },
    });
    if (existing) throw new AppError("Already friends with this user", 409);

    // Create bidirectional friendship
    await PayflowFriend.bulkCreate([
      { userId, friendId: friend.id },
      { userId: friend.id, friendId: userId },
    ], { ignoreDuplicates: true });

    return res.status(201).json({
      success: true,
      message: `${friend.name} added as a friend`,
      data: {
        id: friend.id,
        name: friend.name,
        email: friend.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/payflow/friends/:friendId
 * Removes a friendship (bidirectional).
 */
const removeFriend = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    const link = await PayflowFriend.findOne({ where: { userId, friendId } });
    if (!link) throw new AppError("Friend not found", 404);

    // Remove both directions
    await PayflowFriend.destroy({
      where: {
        [Op.or]: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    return res.json({ success: true, message: "Friend removed" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payflow/friends
 * Returns all friends with their balance relative to the current user.
 */
const getFriends = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const links = await PayflowFriend.findAll({ where: { userId } });
    const friendIds = links.map((l) => l.friendId);

    if (friendIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const friends = await User.findAll({
      where: { id: { [Op.in]: friendIds } },
      attributes: ["id", "name", "email"],
    });

    // Attach balance to each friend
    const result = await Promise.all(
      friends.map(async (f) => {
        const balance = await getBalanceBetween(userId, f.id);
        return {
          id: f.id,
          name: f.name,
          email: f.email,
          balance, // positive = you owe them; negative = they owe you
        };
      })
    );

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// EXPENSES
// ============================================================

/**
 * POST /api/payflow/expenses
 * Body: { title, amount, category, date, paidByUserId, participantIds[] }
 * Creates a shared expense with equal split.
 */
const createExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, amount, category, date, paidByUserId, participantIds, notes } = req.body;

    // Validation
    if (!title || !amount || !date || !paidByUserId || !participantIds || participantIds.length < 2) {
      throw new AppError(
        "title, amount, date, paidByUserId and at least 2 participantIds are required",
        400
      );
    }
    if (Number(amount) <= 0) throw new AppError("Amount must be greater than zero", 400);

    // Ensure paidByUserId is in participants
    if (!participantIds.includes(paidByUserId)) {
      throw new AppError("The payer must be one of the participants", 400);
    }

    const equalShare = Number((Number(amount) / participantIds.length).toFixed(2));

    // Create the expense
    const expense = await PayflowExpense.create({
      title: title.trim(),
      amount: Number(amount),
      category: category || "General",
      date,
      paidByUserId,
      createdByUserId: userId,
      notes: notes || null,
    });

    // Create participant rows
    const participantRows = participantIds.map((pid) => ({
      expenseId: expense.id,
      userId: pid,
      share: equalShare,
      // Payer's own row is auto-settled (they don't owe themselves)
      status: pid === paidByUserId ? "settled" : "pending",
    }));

    await PayflowParticipant.bulkCreate(participantRows);

    return res.status(201).json({
      success: true,
      message: "Shared expense created",
      data: { ...expense.toJSON(), equalShare },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payflow/expenses
 * Returns all expenses where the current user is a participant or the creator.
 */
const getExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all expenseIds where user is a participant
    const participantRows = await PayflowParticipant.findAll({
      where: { userId },
      attributes: ["expenseId"],
    });
    const participatedExpenseIds = participantRows.map((p) => p.expenseId);

    // Build where clause safely (avoid Op.in with empty array)
    let whereClause;
    if (participatedExpenseIds.length > 0) {
      whereClause = {
        [Op.or]: [
          { createdByUserId: userId },
          { id: { [Op.in]: participatedExpenseIds } },
        ],
      };
    } else {
      whereClause = { createdByUserId: userId };
    }

    const expenses = await PayflowExpense.findAll({
      where: whereClause,
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });

    // Attach participants and payer info to each expense
    const result = await Promise.all(
      expenses.map(async (exp) => {
        const participants = await PayflowParticipant.findAll({
          where: { expenseId: exp.id },
          attributes: ["userId", "share", "status"],
        });

        const participantUserIds = participants.map((p) => p.userId);
        const participantUsers = participantUserIds.length > 0
          ? await User.findAll({
              where: { id: { [Op.in]: participantUserIds } },
              attributes: ["id", "name", "email"],
            })
          : [];

        const payer = await User.findByPk(exp.paidByUserId, {
          attributes: ["id", "name", "email"],
        });

        const enrichedParticipants = participants.map((p) => {
          const u = participantUsers.find((u) => u.id === p.userId);
          return {
            userId: p.userId,
            name: u ? u.name : "Unknown",
            email: u ? u.email : "",
            share: Number(p.share),
            status: p.status,
          };
        });

        // Overall expense status
        const allSettled = participants.every((p) => p.status === "settled");

        return {
          ...exp.toJSON(),
          amount: Number(exp.amount),
          payer: payer ? { id: payer.id, name: payer.name, email: payer.email } : null,
          participants: enrichedParticipants,
          status: allSettled ? "settled" : "pending",
        };
      })
    );

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payflow/expenses/:id
 */
const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await PayflowExpense.findByPk(id);
    if (!expense) throw new AppError("Expense not found", 404);

    // Ensure user is involved
    const isParticipant = await PayflowParticipant.findOne({
      where: { expenseId: id, userId },
    });
    if (!isParticipant && expense.createdByUserId !== userId) {
      throw new AppError("Not authorized to view this expense", 403);
    }

    const participants = await PayflowParticipant.findAll({
      where: { expenseId: id },
      attributes: ["userId", "share", "status"],
    });

    const participantUserIds = participants.map((p) => p.userId);
    const participantUsers = await User.findAll({
      where: { id: { [Op.in]: participantUserIds } },
      attributes: ["id", "name", "email"],
    });

    const payer = await User.findByPk(expense.paidByUserId, {
      attributes: ["id", "name", "email"],
    });

    const enrichedParticipants = participants.map((p) => {
      const u = participantUsers.find((u) => u.id === p.userId);
      return {
        userId: p.userId,
        name: u ? u.name : "Unknown",
        email: u ? u.email : "",
        share: Number(p.share),
        status: p.status,
      };
    });

    return res.json({
      success: true,
      data: {
        ...expense.toJSON(),
        amount: Number(expense.amount),
        payer,
        participants: enrichedParticipants,
        status: participants.every((p) => p.status === "settled") ? "settled" : "pending",
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/payflow/expenses/:id
 * Updates expense details and recalculates equal shares.
 */
const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, amount, category, date, paidByUserId, participantIds, notes } = req.body;

    const expense = await PayflowExpense.findOne({ where: { id, createdByUserId: userId } });
    if (!expense) throw new AppError("Expense not found or not authorized", 404);

    // Update fields
    if (title) expense.title = title.trim();
    if (category) expense.category = category;
    if (date) expense.date = date;
    if (notes !== undefined) expense.notes = notes;

    let finalParticipantIds = participantIds;
    let finalAmount = amount !== undefined ? Number(amount) : Number(expense.amount);
    let finalPaidBy = paidByUserId || expense.paidByUserId;

    if (finalAmount <= 0) throw new AppError("Amount must be greater than zero", 400);

    expense.amount = finalAmount;
    expense.paidByUserId = finalPaidBy;

    await expense.save();

    // Recalculate participants if provided
    if (finalParticipantIds && finalParticipantIds.length >= 2) {
      if (!finalParticipantIds.includes(finalPaidBy)) {
        throw new AppError("The payer must be one of the participants", 400);
      }

      // Delete old participant rows
      await PayflowParticipant.destroy({ where: { expenseId: id } });

      const equalShare = Number((finalAmount / finalParticipantIds.length).toFixed(2));

      const newRows = finalParticipantIds.map((pid) => ({
        expenseId: id,
        userId: pid,
        share: equalShare,
        status: pid === finalPaidBy ? "settled" : "pending",
      }));

      await PayflowParticipant.bulkCreate(newRows);
    }

    return res.json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/payflow/expenses/:id
 * Deletes an expense and its participant rows (balances recalculate automatically).
 */
const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await PayflowExpense.findOne({ where: { id, createdByUserId: userId } });
    if (!expense) throw new AppError("Expense not found or not authorized", 404);

    // Delete participants first (no FK cascade set, done manually)
    await PayflowParticipant.destroy({ where: { expenseId: id } });
    await expense.destroy();

    return res.json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// SETTLEMENTS
// ============================================================

/**
 * POST /api/payflow/settlements
 * Body: { toUserId, amount, method, note }
 * Records a settlement from the current user to toUserId.
 * Marks pending participant rows between the two users as settled.
 */
const createSettlement = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { toUserId, amount, method, note } = req.body;

    if (!toUserId || !amount || !method) {
      throw new AppError("toUserId, amount and method are required", 400);
    }
    if (Number(amount) <= 0) throw new AppError("Amount must be positive", 400);
    if (!["cash", "upi", "bank_transfer"].includes(method)) {
      throw new AppError("Invalid method. Use cash, upi, or bank_transfer", 400);
    }

    // Find expenses paid by toUserId where current user is a pending participant
    const expensesPaidByThem = await PayflowExpense.findAll({
      where: { paidByUserId: toUserId },
      attributes: ["id"],
    });
    const expenseIds = expensesPaidByThem.map((e) => e.id);

    if (expenseIds.length > 0) {
      await PayflowParticipant.update(
        { status: "settled" },
        {
          where: {
            expenseId: { [Op.in]: expenseIds },
            userId,
            status: "pending",
          },
        }
      );
    }

    // Create settlement record
    const settlement = await PayflowSettlement.create({
      fromUserId: userId,
      toUserId,
      amount: Number(amount),
      method,
      note: note || null,
    });

    return res.status(201).json({
      success: true,
      message: "Settlement recorded",
      data: settlement,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payflow/settlements
 * Returns all settlements involving the current user.
 */
const getSettlements = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const settlements = await PayflowSettlement.findAll({
      where: {
        [Op.or]: [{ fromUserId: userId }, { toUserId: userId }],
      },
      order: [["createdAt", "DESC"]],
    });

    // Enrich with user names
    const result = await Promise.all(
      settlements.map(async (s) => {
        const from = await User.findByPk(s.fromUserId, { attributes: ["id", "name", "email"] });
        const to = await User.findByPk(s.toUserId, { attributes: ["id", "name", "email"] });
        return {
          ...s.toJSON(),
          amount: Number(s.amount),
          from,
          to,
        };
      })
    );

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// DASHBOARD SUMMARY
// ============================================================

/**
 * GET /api/payflow/dashboard
 * Returns summary card data for the dashboard.
 */
const getDashboard = async (req, res, next) => {
  try {
    const summary = await getDashboardSummary(req.user.id);
    return res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addFriend,
  removeFriend,
  getFriends,
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  createSettlement,
  getSettlements,
  getDashboard,
};
