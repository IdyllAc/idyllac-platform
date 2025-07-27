// routes/auth.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const passport = require('passport');
const router = express.Router();
const { User, RefreshToken } = require('../models');
const db = require('../models');
// const RefreshToken = require('../models/RefreshToken'); // Assume Sequelize or similar ORM is used creates table if not exists
const jwtMiddleware = require('../middleware/jwtMiddleware')
const authenticateToken = require('../middleware/jwtMiddleware');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');
const sequelize = require('../config/database'); // MySQL connection
const { Op } = require('sequelize');
const { FORCE } = require('sequelize/lib/index-hints');



User.findOne({ where: { email: { [Op.like]: '%@domain.com' } } });

// // Database Connection safe database sync (no force)
// sequelize.sync({alter: true}) // Use alter: true for development, or use migrations in production
// .then(() => console.log('Connected to MySQL database'))
// .catch(err => console.error('Unable to connect to MySQL:', err));


// -------------- Register Route ------------
router.post('/register', async (req, res) => {
  const { name, email, cemail, password } = req.body;

  if (email !== cemail) {
    return res.status(400).json({ message: 'Emails do not match' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
     // Insert new user into PostgreSQL database
    const newUser = await User.create({ name, email, password: hashedPassword});

    res.status(201).json({ 
    message: 'New user registered successfully', 
    user: { id: User.id, email: User.email }
   });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------- Login Route -------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body; 
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid email or password' });

    // ✅ Correct usage of imported functions
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user); // ✅ pass the full user objectsaves to DB already uses userId inside now

    // ✅ Save refresh token after generating it
    // await RefreshToken.create({ token: refreshToken, userId: user.id });

    // ✅ Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days
    });

    res.json({ 
      accessToken, 
      refreshToken, 
    message: 'Login successful'
  });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ------------- Refresh Token Route ----------------
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.token;
  if (!refreshToken) return res.status(403).json({ message: 'Refresh token required' });
  
  try {
    const tokenInDb = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!tokenInDb) return res.status(403).json({ message: 'Token not found or revoked' });
    
      const userData = await jwtVerify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

      const newAccessToken = generateAccessToken({ id: userData.id });
      const newRefreshToken = generateRefreshToken({ id: userData.id });

      // Rotate the refresh token
      tokenInDb.token = newRefreshToken;
      await tokenInDb.save();
    
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

// ---------------- Logout Route ---------------
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(400).json({ message: 'No refresh token found' });

  try {
     // If store refresh tokens in DB, delete it from there
    await RefreshToken.destroy({ where: { token: refreshToken } });
    res.clearCookie('refreshToken');
    res.status(200).json({message: 'Logged out successfully' }); 
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Protected API Route: That returns profile/dashboard data only with a valid JWT token
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {  // Fetch user data from the database
      attributes: ['id', 'email', 'name'] 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // If user not found, return 404
    }

    res.json({ // Return user data
    user: {
      id: user.id,
      email: user.email,
      name: user.name || 'User'
    } 
  });
 } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
  }); 


  module.exports = router;