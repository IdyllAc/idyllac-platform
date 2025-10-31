// models/SocialUser.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const SocialUser = sequelize.define('SocialUser', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provider_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'social_users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return SocialUser;
};




// // models/SocialUser.js
// module.exports = (sequelize, DataTypes) => {
//   const SocialUser = sequelize.define('SocialUser', {
//       id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true,
//         allowNull: false,
//       },
//       provider: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       providerId: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         unique: true,
//         field: 'provider_id', // ✅ Proper column name
//       },
//       name: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },
//       email: {
//         type: DataTypes.STRING,
//         allowNull: true,
//         validate: { isEmail: true },
//       },
//       avatarUrl: {
//         type: DataTypes.STRING,
//         allowNull: true,
//         field: 'avatar_url',
//       },
//       userId: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//         field: 'user_id', // ✅ FK to users table (optional)
//       },
//     }, {
//       tableName: 'social_users',
//       underscored: true,
//       timestamps: true,
//       createdAt: 'created_at',
//       updatedAt: 'updated_at',

//       hooks: {
//         afterCreate: (socialUser) => {
//           console.log(`✅ New social user created: ${socialUser.provider} (${socialUser.providerId})`);
//         },
//       },
//     }
//   );

//   SocialUser.associate = (models) => {
//     SocialUser.belongsTo(models.User, {
//       foreignKey: 'user_id', // It's not added in User.js for now
//       as: 'user',
//       onDelete: 'CASCADE',
//     });
//   };

//   return SocialUser;
// };
