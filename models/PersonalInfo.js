// models/PersonalInfo.js
module.exports = (sequelize, DataTypes) => {
    const PersonalInfo = sequelize.define('PersonalInfo', {
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
  
      first_name: { 
        type: DataTypes.STRING(100), 
        allowNull: false,
       },
      last_name: { 
        type: DataTypes.STRING(100), 
        allowNull: false,
       },
      date_of_birth: { 
        type: DataTypes.DATEONLY, 
        allowNull: false,
       },
  
      gender: { 
        type: DataTypes.STRING(10), 
        allowNull: true,
       },
      nationality: { 
        type: DataTypes.STRING(100), 
        allowNull: true,
       },
      occupation: { 
        type: DataTypes.STRING(100), 
        allowNull: true,
       },
      phone: { 
        type: DataTypes.STRING(20), 
        allowNull: true,
       },
  
    }, {
      tableName: 'personal_infos',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // ✅ Add your hook here
    hooks: {
      afterCreate: (info) => {
        console.log(`✅ New personal info created for user ${info.userId}: ${info.full_name}`);
      }
    }
    });
  
    PersonalInfo.associate = models => {
      PersonalInfo.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return PersonalInfo;
  };
  