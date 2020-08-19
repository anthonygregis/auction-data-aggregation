'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('items', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      quality: {
        type: Sequelize.STRING
      },
      level: {
        type: Sequelize.INTEGER
      },
      media: {
        type: Sequelize.STRING
      },
      itemClass: {
        type: Sequelize.STRING
      },
      itemSubclass: {
        type: Sequelize.STRING
      },
      inventoryType: {
        type: Sequelize.STRING
      },
      vendorPurchase: {
        type: Sequelize.FLOAT
      },
      vendorSell: {
        type: Sequelize.FLOAT
      },
      maxCount: {
        type: Sequelize.INTEGER
      },
      isEquippable: {
        type: Sequelize.BOOLEAN
      },
      isStackable: {
        type: Sequelize.BOOLEAN
      },
      purchaseQuantity: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('items');
  }
};