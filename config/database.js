// config/database.js
require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || "stidyllac",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "idyllac_db_e081",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_DIALECT || "postgres",
    port: process.env.DB_PORT || 5432,
    logging: false,
    dialectOptions: {
      ssl: false, // 👈 no SSL locally
    },
  },

  test: {
    username: process.env.DB_USER || "stidyllac",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "idyllac_db_test",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "postgres",
    port: process.env.DB_PORT || 5432,
    logging: false,
    dialectOptions: {
      ssl: false, // 👈 no SSL in test either
    },
  },

  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Render self-signed certs
      },
    },
  },
};
