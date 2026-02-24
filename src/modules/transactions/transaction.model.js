const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Transaction = sequelize.define(
  "Transaction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.ENUM("INR", "USD", "EUR"),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    recurringInterval: {
      type: DataTypes.ENUM("monthly", "weekly", "yearly"),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["categoryId"] },
      { fields: ["transactionDate"] },
    ],
  }
);

module.exports = Transaction;
