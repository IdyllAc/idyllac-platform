// app.js
require('dotenv').config(); 
const express = require('express');
const passport = require('passport');
const sequelize = require('./config/database');
const cors = require('cors');
const authenticateToken = require('./middleware/jwtMiddleware');

// Route Files
const authRoutes = require('./routes/auth');        // JWT-based auth
const personalRoutes = require('./routes/personal'); // /submit/personal_info
const protectRoutes = require('./routes/protect');   // /submit/upload/document + /selfie
const userRoutes = require('./routes/user');         // /profile, /settings

const PORT = process.env.PORT || 4000 

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());
app.use(cors({ origin: 'https://anypay.cards', credentials: true }));

// Connect and sync database
sequelize.authenticate()
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err));

sequelize.sync()
    .then(() => console.log('Database & tables created!'))
    .catch(err => console.log('Failed to sync database: ' + err));

// Routes
app.use('/auth', authRoutes);         // /auth/register, /auth/login, /auth/token, etc.
app.use('/submit', personalRoutes);   // /submit/personal_info
app.use('/submit', protectRoutes);    // /submit/upload/document, /submit/upload/selfie
app.use('/', userRoutes);  //mounts /profile, /settings correctly, etc.

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log('API Server running on port 4000');
});
