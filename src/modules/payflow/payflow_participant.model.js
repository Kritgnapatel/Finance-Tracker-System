const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

/**
 * PayflowParticipant — per-person split share for an expense.
 * For an expense of ₹2400 with 3 participants, each participant
 * gets a share of ₹800.
 *
 * Status interpretation:
 *   - pending  → this person still owes their share to paidByUserId
 *   - settled  → this person has paid up
 *
 * Note: The payer's own participant row is created with status 'settled'
 * since they don't owe themselves.
 */
const PayflowParticipant = sequelize.define(
  "PayflowParticipant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    expenseId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    share: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "settled"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "payflow_participants",
    timestamps: true,
    indexes: [
      { fields: ["expenseId"] },
      { fields: ["userId"] },
      { fields: ["status"] },
    ],
  }
);

module.exports = PayflowParticipant;
