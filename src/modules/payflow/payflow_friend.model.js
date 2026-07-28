const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

/**
 * PayflowFriend — tracks friendship links between registered users.
 * A friendship is directional (userId → friendId), but the service
 * always creates both directions for a bidirectional relationship.
 */
const PayflowFriend = sequelize.define(
  "PayflowFriend",
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
    friendId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "payflow_friends",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["friendId"] },
      {
        unique: true,
        fields: ["userId", "friendId"],
        name: "unique_friendship_pair",
      },
    ],
  }
);

module.exports = PayflowFriend;
