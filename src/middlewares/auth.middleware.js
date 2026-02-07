const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const User = require("../modules/users/user.model");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Authorization token missing", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.sub || decoded.userId);

    if (!user) {
      throw new AppError("User no longer exists", 401);
    }

    req.user = { id: user.id };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = protect; // 🔥 DEFAULT EXPORT
