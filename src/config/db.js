const { Sequelize } = require("sequelize");
require("dotenv").config();

// 🔹 Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false, // production-style logging off
  }
);

// 🔹 DB connect + sync
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // 🔥 IMPORTANT: sync schema (DEV MODE)
    // This will add preferredCurrency, enums, etc.
    await sequelize.sync({ alter: true });

    console.log("📦 Database synced");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB,
};
