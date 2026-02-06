const express = require("express");
const cors = require("cors");

const categoryRoutes = require("./modules/categories/category.routes");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ❗ ERROR MIDDLEWARE — ALWAYS LAST
app.use(errorHandler);

module.exports = app;
