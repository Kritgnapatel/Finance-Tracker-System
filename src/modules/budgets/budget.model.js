const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Budget = sequelize.define("Budget", {
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

  month: {
    type: DataTypes.STRING, // "02"
    allowNull: false,
  },

  year: {
    type: DataTypes.STRING, // "2026"
    allowNull: false,
  },

  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Budget;
