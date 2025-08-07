// controllers/authController.js

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { User, RefreshToken } = require('../models');
const { sendConfirmationEmail } = require('../utils/sendEmail');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');


// GET /login
exports.getLogin = (req, res) => {
  res.render('login');
};


exports.postLogin = async (req, res) => {
  const { email, password } = req.body; 

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ✅ Block login if email not confirmed yet
    if (!user.is_confirmed) {
      return res.status(403).json({ message: 'Please confirm your email before logging in.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid email or password' });

    // ✅ Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // ✅ Save refresh token in DB
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

     // Save data to session
  req.session.userId = user.id;
  req.session.isLoggedIn = true;

  res.redirect('/dashboard');

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};


// GET /register
exports.getRegister = (req, res) => {
  res.render('register');
};


exports.postRegister = async (req, res) => {
  try {
    const { name, email, cemail, password } = req.body;

    if (!name || !email || !cemail || !password) {
       return res.status(400).send('All fields are required');
    }
      

    if (email !== cemail) {
      return res.status(400).send("Emails do not match.");
    }

     // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate confirmation token once and use it for both DB and email
    const confirmationToken = uuidv4();  // require('uuid')

    // create and save new user in DB (not confirmed yet)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      is_confirmed: false,
      confirmation_token,
    });

    // Ensure BASE_URL is set in your environment variables
    if (!process.env.BASE_URL) {
      console.error("BASE_URL environment variable is not set.");
      return res.status(500).json({ message: "Server error. Try later." });
    }

    try {
      // ✅ Send confirmation email using the correct token
      await sendConfirmationEmail(newUser.email, confirmationToken);

      // ✅ Respond with access token and user info
      return res.status(201).json({
        message: "Registration successful. Please check your email to confirm.",
         // name: newUser.name || 'User',
      });

      // ✅ Finally redirect to login page (EJS)
      // return res.redirect('/login'); // Final redirect after success
      
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      req.flash('error', 'Failed to send confirmation email. Please try again later.');
      return res.redirect('/register');
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.redirect('/register');
  }
};



exports.refreshToken = async (req, res) => {
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
};


exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(400).json({ message: 'No refresh token found' });

  try {
    await RefreshToken.destroy({ where: { token: refreshToken } });
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
};


exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'name'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'User',
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};


exports.confirmEmail = async (req, res) => {
  const { token } = req.params;
  console.log("Hit confirmation route with token:", token); // ✅ Logging the token received

  try {
    // Find user by confirmation token
    const user = await User.findOne({ where: { confirmation_token: token } }); // use correct column name

    if (!user) {
      console.log("Token not found in DB:", token); // ✅ Logging if token is not found
      req.flash('error', 'Invalid or expired confirmation token.');
      return res.redirect('/login');
    }

    // Update user to mark email as confirmed 
    user.is_confirmed = true;
    user.confirmation_token = null; // Clear the token after confirmation
    await user.save();

    req.flash('info', 'Your email has been successfully confirmed. You can now log in.');
    // ✅ Redirect to login or show success page
    return res.redirect('/login?confirmed=true');

    } catch (err) {
    console.error('Email confirmation error:', err);
    req.flash('error', 'Something went wrong. Please try again later.');
    return res.redirect('/login');
  }
};


// Exported functions (postRegister, postLogin, refreshToken, logout, getDashboard, confirmEmail)
// will go here...

// module.exports = {
//   postRegister,
//   postLogin,
//   refreshToken,
//   logout,
//   getDashboard,
//   confirmEmail
// };

