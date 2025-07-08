// models/PersonalInfo.js
module.exports = (sequelize, DataTypes) => {
    const PersonalInfo = sequelize.define('PersonalInfo', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
  
      first_name: { type: DataTypes.STRING(100), allowNull: false },
      last_name: { type: DataTypes.STRING(100), allowNull: false },
      date_of_birth: { type: DataTypes.DATEONLY, allowNull: false },
  
      gender: { type: DataTypes.STRING(10), allowNull: true },
      nationality: { type: DataTypes.STRING(100), allowNull: true },
      occupation: { type: DataTypes.STRING(100), allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
  
    }, {
      tableName: 'personal_infos',
      underscored: true,
      timestamps: true,
    });
  
    PersonalInfo.associate = models => {
      PersonalInfo.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return PersonalInfo;
  };
  