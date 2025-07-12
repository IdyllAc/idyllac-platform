'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Subscriber extends Model {
    static associate(models) {
      Subscriber.hasMany(models.Message, {
        foreignKey: 'subscriberId',
        as: 'messages',
        onDelete: 'CASCADE'
      });
    }
  }
  Subscriber.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Subscriber',
  });
  return Subscriber;
};
