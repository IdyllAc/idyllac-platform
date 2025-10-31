'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },

      // 🔒 Fixed (required) fields
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      // 🟢 Optional or editable fields
      gender: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },

      nationality: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      occupation: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

    phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      phone_alt: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      telephone_fixe: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      country_of_birth: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      country_of_living: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      state: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      language_preference: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      profile_photo: {
        type: Sequelize.STRING, // URL or file path
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_profiles');
  },
};
