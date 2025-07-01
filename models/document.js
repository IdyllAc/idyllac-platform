// models/document.js
module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    passport_path: { type: DataTypes.STRING(255) },
    id_card_path: { type: DataTypes.STRING(255) },
    license_path: { type: DataTypes.STRING(255) },
  }, { tableName: 'documents', timestamps: false });

  Document.associate = models => {
    Document.belongsTo(models.User, { 
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
  };

  return Document;
};
