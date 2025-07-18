// models/Document.js
module.exports = (sequelize, DataTypes) => {
    const Document = sequelize.define('Document', {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
       },
  
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id', // 👈 tells Sequelize to map to DB column `user_id`
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
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // ✅ HOOKS SHOULD BE HERE:
    hooks: {
      afterCreate: (doc) => {
        console.log(`✅ New document created for user ${doc.userId}`);
      }
    }
    });
  
    Document.associate = models => {
      Document.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return Document;
  };
  