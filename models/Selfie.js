// models/Selfie.js
module.exports = (sequelize, DataTypes) => {
    const Selfie = sequelize.define('Selfie', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
  
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id', // 👈 tells Sequelize to map to DB column `user_id`
      },
  
      selfie_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
  
    }, {
      tableName: 'selfies',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      hooks: {
        beforeCreate: (selfie) => {
          if (!selfie.filePath) {
            throw new Error("❌ Selfie file path is required");
          }
        },
        afterCreate: (selfie) => {
          console.log(`✅ New selfie uploaded for user ${selfie.userId}`);
        }
      }
      
    });
  
    Selfie.associate = models => {
      Selfie.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return Selfie;
  };
  