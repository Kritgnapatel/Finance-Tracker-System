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
    logging: false, // production-style
  }
);

// 🔹 DB connect + sync
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // 🔥 Load models BEFORE associations
    const Category = require("../modules/categories/category.model");
    const Transaction = require("../modules/transactions/transaction.model");

    // 🔗 Associations
    Category.hasMany(Transaction, {
      foreignKey: "categoryId",
    });

    Transaction.belongsTo(Category, {
      foreignKey: "categoryId",
    });

    await sequelize.sync();
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
