const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true,
  validate: {
    isEmail: true,
  },
},

    passwordHash: {
      type: DataTypes.TEXT,
      allowNull: true, // Google OAuth users
    },
    preferredCurrency: {
  type: DataTypes.ENUM("INR", "USD", "EUR"),
  allowNull: false,
  defaultValue: "INR",
},

  },
  {
    tableName: "users",
    timestamps: true,
  }
);

module.exports = User;
