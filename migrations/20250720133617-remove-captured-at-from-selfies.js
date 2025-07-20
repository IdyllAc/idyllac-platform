'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('selfies', 'captured_at');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('selfies', 'captured_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  }
};
