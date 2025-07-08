// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    isConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
    confirmationToken: { type: DataTypes.STRING(255) },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: false, // ✅ Keep camelCase
  });

  User.associate = models => {
    User.hasOne(models.UserProfile,     { foreignKey: 'userId', as: 'profile' });
    User.hasOne(models.UserSettings,    { foreignKey: 'userId', as: 'settings' });
    User.hasOne(models.PersonalInfo,    { foreignKey: 'userId', as: 'personalInfo', onDelete: 'CASCADE' });
    User.hasOne(models.Document,        { foreignKey: 'userId', as: 'document', onDelete: 'CASCADE' });
    User.hasOne(models.Selfie,          { foreignKey: 'userId', as: 'selfie', onDelete: 'CASCADE' });
    User.hasMany(models.RefreshToken,   { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
  };

  return User;
};
