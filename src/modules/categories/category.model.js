const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Category = sequelize.define(
  "Category",
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

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "categories",
    timestamps: true,
  }
);

module.exports = Category;
