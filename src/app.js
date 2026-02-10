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

/* ===================== GLOBAL MIDDLEWARES ===================== */
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(passport.initialize());

/* ===================== STATIC UPLOADS ===================== */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ===================== API ROUTES ===================== */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/investments", investmentRoutes);

/* ===================== HEALTH ===================== */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ fallback (manual browser check)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    source: "fallback",
    timestamp: new Date().toISOString(),
  });
});

/* ===================== FRONTEND (🔥 VERY IMPORTANT) ===================== */
const frontendPath = path.join(process.cwd(), "frontend");

// serve static frontend
app.use(express.static(frontendPath));

// fallback → index.html (SPA behaviour)
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* ===================== ERROR HANDLER ===================== */
app.use(errorHandler);

module.exports = app;
