const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

/**
 * PayflowExpense — represents a shared expense record.
 * The actual per-person splits are stored in PayflowParticipant.
 */
const PayflowExpense = sequelize.define(
  "PayflowExpense",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "General",
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // Who actually paid (may or may not be the creator)
    paidByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // Who created/manages this record
    createdByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "payflow_expenses",
    timestamps: true,
    indexes: [
      { fields: ["paidByUserId"] },
      { fields: ["createdByUserId"] },
      { fields: ["date"] },
    ],
  }
);

module.exports = PayflowExpense;
