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
  validate: {
    notZero(value) {
      if (Number(value) === 0) {
        throw new Error("Amount cannot be zero");
      }
    },
  },
},

    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "INR",
    },

    description: {
      type: DataTypes.TEXT,
    },

    transactionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    indexes: [
    { fields: ["userId"] },
    { fields: ["categoryId"] },
    { fields: ["transactionDate"] },
  ],
  },
  {
    tableName: "transactions",
    timestamps: true,
  },
  

);

module.exports = Transaction;
