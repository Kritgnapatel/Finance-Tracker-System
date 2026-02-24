const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const SavingsGoal = sequelize.define(
    "SavingsGoal",
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
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        targetAmount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        currentAmount: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
        },
        deadline: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING,
            defaultValue: "#3b82f6", // default accent blue
        }
    },
    {
        timestamps: true,
        indexes: [
            { fields: ["userId"] }
        ],
    }
);

module.exports = SavingsGoal;
