const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(" Database connected successfully");

    await sequelize.sync({ alter: true });
    console.log(" Database synced");
  } catch (error) {
    console.error(" Database connection failed:", error);
  }
};

module.exports = {
  sequelize,
  connectDB,
};
