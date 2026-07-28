const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

/**
 * PayflowSettlement — records a manual settlement between two users.
 * When user A settles with user B, pending participant rows between
 * those two users are updated to 'settled' and this record is created
 * for audit history.
 */
const PayflowSettlement = sequelize.define(
  "PayflowSettlement",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Who is paying (the one who owed money)
    fromUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // Who is receiving (the one who paid for the expense)
    toUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM("cash", "upi", "bank_transfer"),
      allowNull: false,
      defaultValue: "cash",
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "payflow_settlements",
    timestamps: true,
    indexes: [
      { fields: ["fromUserId"] },
      { fields: ["toUserId"] },
    ],
  }
);

module.exports = PayflowSettlement;
