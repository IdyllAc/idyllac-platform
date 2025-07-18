// models/RefreshToken.js
module.exports = (sequelize, DataTypes) => {
    const RefreshToken = sequelize.define('RefreshToken', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id', // 👈 tells Sequelize to map to DB column `user_id`
      
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
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // ✅ HOOKS SHOULD BE HERE:
    hooks: {
      beforeCreate: (token) => {
        if (!token.token) {
          throw new Error("❌ Refresh token cannot be empty");
        }
      },
      afterCreate: (token) => {
        console.log(`✅ Refresh token created for user ${token.userId}`);
      },
    },
    });
  
    RefreshToken.associate = (models) => {
      RefreshToken.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return RefreshToken;
  };
  