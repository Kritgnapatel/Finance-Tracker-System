const User = require("./user.model");
const AppError = require("../../utils/AppError");

/**
 * GET CURRENT USER PROFILE
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "createdAt"],
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE CURRENT USER PROFILE
 */
const updateMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name && !email) {
      throw new AppError("Nothing to update", 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Email uniqueness check
    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) {
        throw new AppError("Email already in use", 400);
      }
      user.email = email;
    }

    if (name) user.name = name;

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updatePreferredCurrency = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { preferredCurrency } = req.body;

    if (!preferredCurrency) {
      throw new AppError("Preferred currency is required", 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.preferredCurrency = preferredCurrency;
    await user.save();

    res.json({
      success: true,
      message: "Preferred currency updated successfully",
      data: {
        preferredCurrency: user.preferredCurrency,
      },
    });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getMe,
  updateMe,
  updatePreferredCurrency,
};

