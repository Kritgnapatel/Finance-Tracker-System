const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Investment = sequelize.define(
  "Investment",
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
    type: {
      type: DataTypes.ENUM(
        "stock",
        "crypto",
        "mutual_fund",
        "fd",
        "other"
      ),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    investmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    indexes: [
      { fields: ["userId"] },
      { fields: ["type"] },
      { fields: ["investmentDate"] },
    ],
  }
);

module.exports = Investment;
