const Investment = require("./investment.model");
const AppError = require("../../utils/AppError");

/**
 * CREATE INVESTMENT
 */
const createInvestment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, amount, investmentDate, notes } = req.body;

    if (!type || amount === undefined || !investmentDate) {
      throw new AppError("Missing required investment fields", 400);
    }

    const investment = await Investment.create({
      userId,
      type,
      amount,
      investmentDate,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Investment added successfully",
      data: investment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * LIST INVESTMENTS
 */
const getInvestments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const investments = await Investment.findAll({
      where: { userId },
      order: [["investmentDate", "DESC"]],
    });

    return res.json({
      success: true,
      data: investments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE INVESTMENT
 */
const deleteInvestment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const investment = await Investment.findOne({
      where: { id, userId },
    });

    if (!investment) {
      throw new AppError("Investment not found", 404);
    }

    await investment.destroy();

    return res.json({
      success: true,
      message: "Investment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvestment,
  getInvestments,
  deleteInvestment,
};
