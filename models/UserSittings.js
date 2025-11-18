// models/userSettings.js
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
      field: 'user_id',
    },

    // ────────────────────────────────
    // 1️⃣ NOTIFICATION SETTINGS
    // ────────────────────────────────
    email_notifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    sms_notifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    marketing_emails: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    app_notifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // ────────────────────────────────
    // 2️⃣ DISPLAY / UI SETTINGS
    // ────────────────────────────────
    dark_mode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'en',
    },
    timezone: {
      type: DataTypes.STRING(40),
      defaultValue: 'UTC',
    },

    // ────────────────────────────────
    // 3️⃣ SECURITY SETTINGS
    // ────────────────────────────────
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    auto_logout_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },

    // ────────────────────────────────
    // 4️⃣ PRIVACY SETTINGS
    // ────────────────────────────────
    profile_visibility: {
      type: DataTypes.ENUM('public', 'private', 'friends'),
      defaultValue: 'private',
    },

    show_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    show_phone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    data_collection_opt_in: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    allow_tagging: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // ────────────────────────────────
    // 5️⃣ ACCOUNT SETTINGS
    // ────────────────────────────────
    auto_play_media: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    save_activity_history: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    content_language: {
      type: DataTypes.STRING(10),
      defaultValue: 'en',
    },

  }, {
    tableName: 'user_settings',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    hooks: {
      beforeCreate: (settings) => {
        if (!settings.language) settings.language = 'en';
      },
      afterCreate: (settings) => {
        console.log(`✅ Settings created for user ${settings.userId}`);
      }
    }
  });

  UserSettings.associate = (models) => {
    UserSettings.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return UserSettings;
};










// // models/UserSettings.js
// module.exports = (sequelize, DataTypes) => {
//   const UserSettings = sequelize.define('UserSettings', {
//     id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       autoIncrement: true,
//       primaryKey: true,
//     },

//     userId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       field: 'user_id',
//     },

//     // Notifications
//     email_notifications: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
//     sms_notifications: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
//     marketing_notifications: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
//     security_alerts: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

//     // Security
//     two_factor_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
//     two_factor_method: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'email' },

//     // Localization
//     language: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'en' },
//     timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'Europe/Paris' }, // <<<<< defaultValue: Intl.DateTimeFormat().resolvedOptions().timeZone,
//     currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'EUR' },
//     date_format: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'YYYY-MM-DD' },
//     time_format_24h: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

//     // UI / display
//     dark_mode: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
//     text_size: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'medium' },
//     color_theme: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'blue' },

//     // Communication
//     preferred_contact_method: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'email' },

//     // Advanced
//     beta_features_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
//     api_access_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

//   }, {
//     tableName: 'user_settings',
//     underscored: true,
//     timestamps: true,
//     createdAt: 'created_at',
//     updatedAt: 'updated_at',
//     hooks: {
//       beforeCreate: (settings) => {
//         if (!settings.language) settings.language = 'en';
//         if (!settings.timezone) settings.timezone = 'Europe/Paris';
//       },
//       afterCreate: (settings) => {
//         console.log(`✅ New settings created for user ${settings.userId}`);
//       }
//     },
//   });

//   UserSettings.associate = models => {
//     UserSettings.belongsTo(models.User, {
//       foreignKey: 'user_id',
//       as: 'user',
//       onDelete: 'CASCADE',
//     });
//   };

//   return UserSettings;
// };








// // models/UserSettings.js
// module.exports = (sequelize, DataTypes) => {
//     const UserSettings = sequelize.define('UserSettings', {
//       id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         autoIncrement: true,
//         primaryKey: true,
//       },
  
//       userId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         field: 'user_id', // 👈 tells Sequelize to map to DB column `user_id`
//       },
  
//       email_notifications: {
//         type: DataTypes.BOOLEAN,
//         allowNull: false,
//         defaultValue: true,
//       },
  
//       dark_mode: {
//         type: DataTypes.BOOLEAN,
//         allowNull: false,
//         defaultValue: false,
//       },
  
//       language: {
//         type: DataTypes.STRING(10),
//         allowNull: false,
//         defaultValue: 'en',
//       },
  
//     }, {
//       tableName: 'user_settings',
//       underscored: true,
//       timestamps: true,
//       createdAt: 'created_at',
//       updatedAt: 'updated_at',

//       // ✅ HOOKS SHOULD BE HERE:
//       hooks: {
//         beforeCreate: (settings) => {
//           if (!settings.language) {
//             settings.language = 'en'; // default fallback
//           }
//         },
//         afterCreate: (settings) => {
//           console.log(`✅ New settings created for user ${settings.userId}`);
//         }
//       },
//     });
  
//     UserSettings.associate = models => {
//       UserSettings.belongsTo(models.User, {
//         foreignKey: 'user_id',
//         as: 'user',
//         onDelete: 'CASCADE',
//       });
//     };
  
//     return UserSettings;
//   };
  