const sequelize = require('./config/database');

sequelize.authenticate()
  .then(() => console.log('✅ DB Connected Successfully'))
  .catch(err => console.error('❌ DB Connection Error:', err));

  sequelize.query("SELECT DATABASE();", { type: sequelize.QueryTypes.SELECT })
  .then(result => {
    console.log("Currently connected to DB:", result[0]['DATABASE()']);
  });

