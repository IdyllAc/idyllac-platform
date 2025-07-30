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
const { Op } = require('sequelize');
const sequelize = require('../config/database'); // MySQL connection
const authenticateToken = require('../middleware/jwtMiddleware');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');
const crypto = require('crypto');
const sendConfirmationEmail = require('../utils/sendEmail'); // Import your email utility function
const { v4: uuidv4 } = require('uuid'); // Top of file, for token generation


User.findOne({ where: { email: { [Op.like]: '%@domain.com' } } });


// -------------- Register Route ------------
router.post('/register', async (req, res) => {
  const { name, email, cemail, password } = req.body;

  if (email !== cemail) {
    return res.status(400).json({ message: 'Emails do not match' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    } 

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
     const confirmationToken = uuidv4();

     // create new user in DB (not confirmed yet)
    const newUser = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      isConfirmed: false, // default on registration
      confirmationToken, // store confirmation token
    });

    // ✅ Send after user is created and confirmationToken is generated email here
    await sendConfirmationEmail(newUser.email, confirmationToken); // Implement this function to send email

    // ✅ Generate JWT tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = await generateRefreshToken(newUser); // ✅ pass the full user object

    // ✅ Save refresh token in the database
    await RefreshToken.create({ token: refreshToken, userId: newUser.id });

    // ✅ Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ✅ Respond with access token and user info
    return res.status(201).json({ 
      // res.send(`Registration successful! <br><a href="${confirmationUrl}">Click here to confirm your email</a>`);
      // console.log(`🧪 Confirmation URL for testing: ${process.env.BASE_URL}/auth/confirm-email/${token}`);
      message: 'Registration successful. Please check your email for confirmation. ', 
      // redirect:'/login', 
      accessToken, 
      refreshToken, 
      user: { 
        id: newUser.id, 
        email: newUser.email, 
        name: newUser.name || 'User' 
      }
    });

      // return res.redirect('/login'); // ✅ No tokens, just redirect
    } catch (err) {
       console.error('Register error:', err);
       return res.status(500).json({ error: 'Server error' });
     }
  });

// ------------- Login Route -------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body; 
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({message: 'Invalid email or password.' });
    }

    // ✅ Block login if email not confirmed yet
    if (!user.isConfirmed) {
      return res.status(403).json({ message: 'Please confirm your email before logging in.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid email or password' });

    // ✅ Correct usage of imported functions
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user); // ✅ pass the full user objectsaves to DB already uses userId inside now

    // ✅ Save refresh token after generating it
     await RefreshToken.create({ token: refreshToken, userId: user.id });

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

// Email Confirmation Route
router.get('/confirm-email/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Find user by confirmation token
    const user = await User.findOne({ where: { confirmationToken: token } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired confirmation link.' });
    }

    // Update user to mark email as confirmed
    user.isConfirmed = true;
    user.confirmationToken = null; // Clear the token after confirmation
    await user.save();

    // ✅ Redirect to login or show success page
    res.redirect('/login?confirmed=true');
    // OR: res.render('confirmation-success', { email: user.email });


    // res.status(200).json({ message: 'Email confirmed successfully. You can now log in.' });
  } catch (err) {
    console.error('Email confirmation error:', err);
    res.status(500).send('Something went wrong.');
  }
});


  module.exports = router;