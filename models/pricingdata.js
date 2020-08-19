'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class pricingData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.pricingData.belongsTo(models.item)
      models.pricingData.belongsTo(models.connectedRealm)
    }
  };
  pricingData.init({
    unitPrice: DataTypes.BIGINT,
    quantity: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'pricingData',
  });
  return pricingData;
};