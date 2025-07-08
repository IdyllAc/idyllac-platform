// models/Document.js
module.exports = (sequelize, DataTypes) => {
    const Document = sequelize.define('Document', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
  
      passport_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      id_card_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      license_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    }, {
      tableName: 'documents',
      underscored: true,
      timestamps: true,
    });
  
    Document.associate = models => {
      Document.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return Document;
  };
  