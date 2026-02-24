const app = require("../src/app");
const { connectDB } = require("../src/config/db");

// 🔥 Load ALL models ONCE so Sequelize registers them
require("../src/modules/users/user.model");
require("../src/modules/categories/category.model");
require("../src/modules/transactions/transaction.model");
require("../src/modules/investments/investment.model");
require("../src/modules/savings/savingsGoal.model");

// Configure DB connection for Serverless environment
connectDB().catch(err => {
    console.error("Failed to connect to database:", err);
});

// Export the express app so Vercel can handle requests
module.exports = app;
