// models/UserSettings.js
module.exports = (sequelize, DataTypes) => {
    const UserSettings = sequelize.define('UserSettings', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
  
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id', // 👈 tells Sequelize to map to DB column `user_id`
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
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // ✅ HOOKS SHOULD BE HERE:
      hooks: {
        beforeCreate: (settings) => {
          if (!settings.language) {
            settings.language = 'en'; // default fallback
          }
        },
        afterCreate: (settings) => {
          console.log(`✅ New settings created for user ${settings.userId}`);
        }
      },
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
  