// models/selfie.js
module.exports = (sequelize, DataTypes) => {
  const Selfie = sequelize.define('Selfie', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    selfie_path: { type: DataTypes.STRING(255) },
    captured_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'selfies', timestamps: false });

  Selfie.associate = models => {
    Selfie.belongsTo(models.User, { 
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
  };

  return Selfie;
};
