// config/database.js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'stidyllac',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'idyllac_db_e081',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'postgres',
    // logging: true,
  },

  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    // protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Render self-signed certs
      },
    },
  },
};
