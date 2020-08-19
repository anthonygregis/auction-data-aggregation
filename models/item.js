'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class item extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.item.hasMany(models.pricingData)
    }
  };
  item.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    name: DataTypes.STRING,
    quality: DataTypes.STRING,
    level: DataTypes.INTEGER,
    media: DataTypes.STRING,
    itemClass: DataTypes.STRING,
    itemSubclass: DataTypes.STRING,
    inventoryType: DataTypes.STRING,
    vendorPurchase: DataTypes.FLOAT,
    vendorSell: DataTypes.FLOAT,
    maxCount: DataTypes.INTEGER,
    isEquippable: DataTypes.BOOLEAN,
    isStackable: DataTypes.BOOLEAN,
    purchaseQuantity: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'item',
  });
  return item;
};