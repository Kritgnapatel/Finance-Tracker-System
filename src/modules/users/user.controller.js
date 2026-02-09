const User = require("./user.model");
const AppError = require("../../utils/AppError");

/**
 * GET CURRENT USER PROFILE
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "name",
        "email",
        "preferredCurrency",
        "createdAt",
      ],
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE CURRENT USER PROFILE
 * (name / email / preferredCurrency)
 */
const updateMe = async (req, res, next) => {
  try {
    const { name, email, preferredCurrency } = req.body;

    if (!name && !email && !preferredCurrency) {
      throw new AppError("Nothing to update", 400);
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (name) user.name = name;

    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) {
        throw new AppError("Email already in use", 400);
      }
      user.email = email;
    }

    if (preferredCurrency) {
      if (!["INR", "USD", "EUR"].includes(preferredCurrency)) {
        throw new AppError("Invalid currency", 400);
      }
      user.preferredCurrency = preferredCurrency;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferredCurrency: user.preferredCurrency,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
};
