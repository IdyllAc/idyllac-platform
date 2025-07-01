// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    name: { type: DataTypes.STRING(100) },
    email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
    password: { type: DataTypes.STRING(255), allowNull: false },
    isConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
    confirmationToken: { type: DataTypes.STRING(255) },
  }, { tableName: 'users', timestamps: false });

  User.associate = models => {
    User.hasOne(models.PersonalInfo, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasOne(models.Document, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasOne(models.Selfie, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
  };

  return User;
};
