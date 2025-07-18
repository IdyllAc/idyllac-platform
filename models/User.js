'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true, 
    },
    name: { 
      type: DataTypes.STRING(100), 
      allowNull: true,
    },
    email: { 
      type: DataTypes.STRING(255), 
      allowNull: false, 
      unique: true,
      validate: { isEmail: true },
    },
    password: { 
      type: DataTypes.STRING(255), 
      allowNull: false,
    },
    isConfirmed: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false,
    },
    confirmationToken: { 
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  }, {
    tableName: 'users',
    underscored: true,   // ✅ same as other models
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    // ✅ Same rhythm for hooks as in other models
    hooks: {
      afterCreate: (user) => {
        console.log(`✅ New user created with ID: ${user.id} & email: ${user.email}`);
      },
    }
  });

  // ✅ Associations in the same style as Subscriber & Message
  User.associate = (models) => {
    User.hasOne(models.UserProfile,     { foreignKey: 'user_id', as: 'profile', onDelete: 'CASCADE' });
    User.hasOne(models.UserSettings,    { foreignKey: 'user_id', as: 'settings', onDelete: 'CASCADE' });
    User.hasOne(models.PersonalInfo,    { foreignKey: 'user_id', as: 'personalInfo', onDelete: 'CASCADE' });
    User.hasOne(models.Document,        { foreignKey: 'user_id', as: 'document', onDelete: 'CASCADE' });
    User.hasOne(models.Selfie,          { foreignKey: 'user_id', as: 'selfie', onDelete: 'CASCADE' });
    User.hasMany(models.RefreshToken,   { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });

    // Optional, only if SocialUser links to User
    // User.hasMany(models.SocialUser, { foreignKey: 'user_id', as: 'socialAccounts', onDelete: 'CASCADE' });
  };

  return User;
};
