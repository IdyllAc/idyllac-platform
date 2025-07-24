// models/UserProfile.js
module.exports = (sequelize, DataTypes) => {
    const UserProfile = sequelize.define('UserProfile', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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

     phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
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
  
    }, {
      tableName: 'user_profiles',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // ✅ HOOKS SHOULD BE HERE:
      hooks: {
        beforeCreate: (profile) => {
          if (!profile.full_name) {
            throw new Error("❌ Full name is required for profile creation");
          }
        },
        afterCreate: (profile) => {
          console.log(`✅ New profile created for user ${profile.userId}`);
        }
      }
      
    });
  
    UserProfile.associate = models => {
      UserProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return UserProfile;
  };
  