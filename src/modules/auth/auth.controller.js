const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../users/user.model");
const AppError = require("../../utils/AppError");

const seedUserCategories = require("../../utils/seedUserCategories");


/**
 * REGISTER USER
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      throw new AppError("All fields are required", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
    });
    await seedUserCategories(user.id);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        userId: user.id,
      },
    });
  } catch (error) {
    next(error); // forward to global error handler
  }
};

/**
 * LOGIN USER
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError("Email and password required", 400);
    }

    // Find user
    const user = await User.findOne({ where: { email } });

    // Same error message to prevent user enumeration
    if (!user || !user.passwordHash) {
      throw new AppError("Invalid credentials", 401);
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    // Generate JWT (using standard `sub`)
    const token = jwt.sign(
      { sub: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
      },
    });
  } catch (error) {
    next(error); // forward to global error handler
  }
};


module.exports = {
  register,
  login
};

