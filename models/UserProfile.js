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
      field: 'user_id', // maps to DB column user_id
    },

    // 🔒 Fixed columns
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

    // 🟢 Optional / editable
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

    phone_alt: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    telephone_fixe: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
   
    // 🌍 Location / Address
    country_of_birth: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country_of_living: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    // 🌐 Preferences
    language_preference: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // 🖼️ Profile
    profile_photo: {
      type: DataTypes.STRING, // URL or file path
      allowNull: true,
    },
  }, {
    tableName: 'user_profiles',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    hooks: {
      beforeCreate: (profile) => {
        if (!profile.first_name || !profile.last_name || !profile.date_of_birth) {
          throw new Error("❌ first_name, last_name, and date_of_birth are required");
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
