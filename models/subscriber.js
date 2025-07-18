// models/Subscriber.js

'use strict';

module.exports = (sequelize, DataTypes) => {
  const Subscriber = sequelize.define('Subscriber', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    tableName: 'subscribers',
    underscored: true, // ✅ DB columns: created_at, updated_at
    timestamps: true,  // ✅ auto adds created_at & updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at',

      // ✅ HOOKS SHOULD BE HERE:
    hooks: {
      afterCreate: (subscriber) => {
        console.log(`✅ New subscriber created: ${subscriber.email}`);
      }
    }
  });

  // ✅ Associations
  Subscriber.associate = (models) => {
    Subscriber.hasMany(models.Message, {
      foreignKey: 'subscriber_id',
      as: 'messages',
      onDelete: 'CASCADE',
    });
  };

  return Subscriber;
};
