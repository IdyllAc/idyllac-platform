// models/index.js
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(path.join(__dirname, "..", "config", "database.js"))[env];

const db = {};

// ✅ Fallback if NODE_ENV is invalid
if (!config) {
  throw new Error(`❌ No database config found for NODE_ENV="${env}". Check config/database.js`);
}

let sequelize;

// ✅ Prefer DATABASE_URL if explicitly configured
if (config.use_env_variable) {
  const url = process.env[config.use_env_variable];
  if (!url) {
    throw new Error(`❌ Environment variable "${config.use_env_variable}" is not set`);
  }
  sequelize = new Sequelize(url, config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}


// // ✅ Handle production vs dev/test gracefully
// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

// ✅ Load all model files
fs.readdirSync(__dirname)
  .filter((file) => file !== basename && file.endsWith(".js"))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// ✅ Apply associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) db[modelName].associate(db);
});

console.log(`✅ Sequelize initialized. Environment: ${env}`);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
