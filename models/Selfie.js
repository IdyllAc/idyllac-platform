// models/Selfie.js
module.exports = (sequelize, DataTypes) => {
    const Selfie = sequelize.define('Selfie', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
  
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
  
      selfie_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
  
    }, {
      tableName: 'selfies',
      underscored: true,
      timestamps: true,
    });
  
    Selfie.associate = models => {
      Selfie.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return Selfie;
  };
  