// models/RefreshToken.js
module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'userId' }, // ✅ this must match DB exactly
    token: { type: DataTypes.STRING, allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: true },
  }, { tableName: 'refresh_tokens', timestamps: true, underscored: true });

  RefreshToken.associate = models => {
    RefreshToken.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
  };

  return RefreshToken;
};