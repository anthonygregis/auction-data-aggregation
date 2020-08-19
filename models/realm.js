'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class realm extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.realm.hasMany(models.character)
      models.realm.belongsTo(models.connectedRealm)
    }
  };
  realm.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    isTournament: DataTypes.BOOLEAN,
    slug: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'realm',
  });
  return realm;
};