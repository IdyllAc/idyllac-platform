// models/socialuser.js
module.exports = (sequelize, DataTypes) => {
    const SocialUser = sequelize.define('SocialUser', {
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      providerId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true },
      },
      avatarUrl: DataTypes.STRING,
    });
  
    return SocialUser;
  };
  