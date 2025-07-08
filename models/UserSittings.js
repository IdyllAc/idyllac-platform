// models/UserSettings.js
module.exports = (sequelize, DataTypes) => {
    const UserSettings = sequelize.define('UserSettings', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
  
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
  
      email_notifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
  
      dark_mode: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
  
      language: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'en',
      },
  
    }, {
      tableName: 'user_settings',
      underscored: true,
      timestamps: true,
    });
  
    UserSettings.associate = models => {
      UserSettings.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return UserSettings;
  };
  