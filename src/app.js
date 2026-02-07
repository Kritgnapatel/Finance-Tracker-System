const express = require("express");
const cors = require("cors");

const categoryRoutes = require("./modules/categories/category.routes");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const errorHandler = require("./middlewares/error.middleware");
const transactionRoutes = require("./modules/transactions/transaction.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const budgetRoutes = require("./modules/budgets/budget.routes");
const investmentRoutes = require("./modules/investments/investment.routes");
const passport = require("./config/passport");
const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/users", userRoutes);
app.use("/api/investments", investmentRoutes);
app.use(passport.initialize());
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ❗ ERROR MIDDLEWARE — ALWAYS LAST
app.use(errorHandler);

module.exports = app;
