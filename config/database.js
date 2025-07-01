require('dotenv').config(); // Load environment variables FIRST
const { Sequelize } = require('sequelize');
const { FORCE } = require('sequelize/lib/index-hints');


// ✅ Check for DATABASE_URL (standard in Render)
if (!process.env.DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in environment variables');
  process.exit(1); // Stop the app
}

// ✅ Initialize Sequelize with DATABASE_URL (for PostgreSQL)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres', 
    protocol: 'postgres', 
   dialectOptions: {
      ssl: { rejectUnauthorized: false }  
  },
  logging: false, // disable logging; change to true if you want SQL logs     
});

// Sync and Authenticate Database
sequelize.sync(); // For development, or use migrations


// // For debugging – shows what env variables are being read
// console.log('DB ENV:', {
//   DB_NAME: process.env.DB_NAME,
//   DB_USER: process.env.DB_USER,
//   DB_PASSWORD: process.env.DB_PASSWORD,
//   DB_HOST: process.env.DB_HOST
// });

// Test connection
sequelize.authenticate()
  .then(() => console.log('✅ Connected to PostgreSQL via DATABASE_URL'))
  .catch(err => console.error('❌ Failed to connect to PostgreSQL:', err));

// Export for use in models
module.exports = sequelize;
