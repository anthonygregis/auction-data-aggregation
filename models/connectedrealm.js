'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class connectedRealm extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.connectedRealm.hasMany(models.realm)
      models.connectedRealm.hasMany(models.pricingData)
    }
  };
  connectedRealm.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    mythicLeaderboard: DataTypes.STRING,
    auctionHouse: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'connectedRealm',
  });
  return connectedRealm;
};