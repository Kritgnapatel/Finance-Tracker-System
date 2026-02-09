// ✅ Health check (for Render / evaluator)
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

const express = require("express");
const cors = require("cors");
const path = require("path");
const passport = require("./config/passport");

const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const categoryRoutes = require("./modules/categories/category.routes");
const transactionRoutes = require("./modules/transactions/transaction.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const budgetRoutes = require("./modules/budgets/budget.routes");
const investmentRoutes = require("./modules/investments/investment.routes");

const errorHandler = require("./middlewares/error.middleware");

const app = express();


/* -------------------- GLOBAL MIDDLEWARES -------------------- */
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

/* -------------------- STATIC FILES -------------------- */
// Serve uploaded receipts
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


/* -------------------- ROUTES -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/investments", investmentRoutes);

app.use(express.static(path.join(__dirname, "../frontend")));
/* -------------------- HEALTH CHECK -------------------- */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* -------------------- ERROR HANDLER (ALWAYS LAST) -------------------- */
app.use(errorHandler);

module.exports = app;
