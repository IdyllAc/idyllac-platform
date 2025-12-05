'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'tiktok_id', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'registration_method', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'tiktok_id');
    await queryInterface.removeColumn('users', 'registration_method');
  }
};
