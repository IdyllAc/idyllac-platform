'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_settings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },

      email_notifications: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      sms_notifications: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      marketing_emails: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      app_notifications: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

      dark_mode: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      language: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'en' },
      timezone: { type: Sequelize.STRING(40), allowNull: true, defaultValue: 'UTC' },

      two_factor_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      auto_logout_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },

      profile_visibility: { type: Sequelize.ENUM('public','private','friends'), allowNull: false, defaultValue: 'private' },
      show_email: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      show_phone: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      data_collection_opt_in: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      allow_tagging: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

      auto_play_media: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      save_activity_history: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      content_language: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'en' },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('user_settings');
  }
};












// 'use strict';

// module.exports = {
//   up: async (queryInterface, Sequelize) => {
//     // If table doesn't exist, create it. If it exists, you may want to alter instead.
//     const tableExists = await queryInterface.sequelize.query(
//       `SELECT to_regclass('public.user_setting') as exists;`
//     );

//     // Basic approach: try create (will fail if exists). In your dev, run either create or alter path.
//     await queryInterface.createTable('user_setting', {
//       id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
//       user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },

//       email_notifications: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
//       sms_notifications: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
//       marketing_notifications: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
//       security_alerts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

//       two_factor_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
//       two_factor_method: { type: Sequelize.STRING(20), allowNull: true, defaultValue: 'email' },

//       language: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'en' },
//       timezone: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'Europe/Paris' },
//       currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'EUR' },
//       date_format: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'YYYY-MM-DD' },
//       time_format_24h: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

//       dark_mode: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
//       text_size: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'medium' },
//       color_theme: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'blue' },

//       preferred_contact_method: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'email' },

//       beta_features_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
//       api_access_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },

//       created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
//       updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
//     });
//   },

//   down: async (queryInterface, Sequelize) => {
//     await queryInterface.dropTable('user_setting');
//   }
// };









// 'use strict';

// module.exports = {
//   up: async (queryInterface, Sequelize) => {
//     await queryInterface.createTable('user_settings', {
//       id: {
//         type: Sequelize.INTEGER,
//         allowNull: false,
//         autoIncrement: true,
//         primaryKey: true,
//       },

//       user_id: {
//         type: Sequelize.INTEGER,
//         allowNull: false,
//         references: { model: 'users', key: 'id' },
//         onDelete: 'CASCADE',
//       },

//       email_notifications: {
//         type: Sequelize.BOOLEAN,
//         allowNull: false,
//         defaultValue: true,
//       },

//       dark_mode: {
//         type: Sequelize.BOOLEAN,
//         allowNull: false,
//         defaultValue: false,
//       },

//       language: {
//         type: Sequelize.STRING(10),
//         allowNull: false,
//         defaultValue: 'en',
//       },

//       created_at: {
//         type: Sequelize.DATE,
//         allowNull: false,
//         defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
//       },

//       updated_at: {
//         type: Sequelize.DATE,
//         allowNull: false,
//         defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
//       },
//     });
//   },

//   down: async (queryInterface, Sequelize) => {
//     await queryInterface.dropTable('user_settings');
//   }
// };
