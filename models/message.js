// models/Message.js
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      subscriberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'subscriber_id', // ✅ important for consistency
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'messages',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        afterCreate: (msg) => {
          console.log(`✅ New message saved for subscriber ${msg.subscriberId}`);
        },
      },
    }
  );

  Message.associate = (models) => {
    Message.belongsTo(models.Subscriber, {
      foreignKey: 'subscriber_id', // ✅ now snake_case, matching DB column
      as: 'subscriber',
      onDelete: 'CASCADE',
    });
  };

  return Message;
};
