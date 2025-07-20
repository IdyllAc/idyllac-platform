'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_profiles', 'gender');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_profiles', 'gender', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
