'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SocialUsers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      providerId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: Sequelize.STRING,
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      avatarUrl: Sequelize.STRING,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SocialUsers');
  }
};
