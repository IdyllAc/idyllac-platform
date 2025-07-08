// models/RefreshToken.js
module.exports = (sequelize, DataTypes) => {
    const RefreshToken = sequelize.define('RefreshToken', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    }, {
      tableName: 'refresh_tokens',
      timestamps: true,
      underscored: true, // maps userId → user_id, etc.
    });
  
    RefreshToken.associate = (models) => {
      RefreshToken.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return RefreshToken;
  };
  