// models/SocialUser.js
module.exports = (sequelize, DataTypes) => {
  const SocialUser = sequelize.define(
    'SocialUser',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      providerId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'provider_id', // ✅ Proper column name
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true },
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'avatar_url',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id', // ✅ FK to users table (optional)
      },
    },
    {
      tableName: 'social_users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      hooks: {
        afterCreate: (socialUser) => {
          console.log(`✅ New social user created: ${socialUser.provider} (${socialUser.providerId})`);
        },
      },
    }
  );

  SocialUser.associate = (models) => {
    SocialUser.belongsTo(models.User, {
      foreignKey: 'user_id', // It's not added in User.js for now
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return SocialUser;
};
