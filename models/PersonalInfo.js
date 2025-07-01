// models/personalInfo.js
module.exports = (sequelize, DataTypes) => {
  const PersonalInfo = sequelize.define('PersonalInfo', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    gender: { type: DataTypes.ENUM('Monsieur', 'Madame'), allowNull: false },
    name: { type: DataTypes.STRING(100) },
    firstname: { type: DataTypes.STRING(100) },
    dateOfBirth: { type: DataTypes.DATEONLY },
    phone: { type: DataTypes.STRING(20) },
  }, { tableName: 'personal_info', timestamps: false });

  PersonalInfo.associate = models => {
    PersonalInfo.belongsTo(models.User, { 
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
  };

  return PersonalInfo;
};
