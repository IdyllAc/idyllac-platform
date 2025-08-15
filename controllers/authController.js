// controllers/authController.js
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const { User, RefreshToken } = require('../models');
const { sendEmail }  = require('../utils/sendEmail'); // adjust path if needed
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');

const SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret';

// GET /login
exports.getLogin = (req, res) => res.render('login', {
  messages: {
  error: req.flash('error'),
  info: req.flash('info'),
  success: req.flash('success')
}
});

// POST /login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body; 
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    if (!user.is_confirmed) {
      return res.status(403).json({ message: 'Please confirm your email before logging in.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid email or password' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await RefreshToken.create({ token: refreshToken, userId: user.id });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    req.session.userId = user.id;
    req.session.isLoggedIn = true;

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET /register
exports.getRegister = (req, res) => res.render('register');

// POST /register
exports.postRegister = async (req, res) => {
  try {
    const { name, email, cemail, password } = req.body;

    // 1️⃣ Input validation
    if (!name || !email || !cemail || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (email.trim().toLowerCase() !== cemail.trim().toLowerCase()) {
      return res.status(400).json({ message: 'Emails do not match.' });
    }

    // 2️⃣ Check existing user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // 3️⃣ Hash password & create token
    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationToken = uuidv4();

    // 4️⃣ Save user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isConfirmed: false,
      confirmationToken: confirmationToken
    });

    console.log(`✅ New user created: ID ${newUser.id}, token ${confirmationToken}`);

    // 5️⃣ Build confirmation URL
    const confirmUrl= `${process.env.BASE_URL || `${req.protocol}://${req.get('host')}`}/api/auth/confirm-email/${confirmationToken}`;
    console.log(`📧 Confirmation URL: ${confirmUrl}`);

    // 6️⃣ Send email (only once!)
    try {
      await sendEmail(email, 'Confirm your email', confirmationToken);
      console.log(`✅ Confirmation email sent to ${newUser.email}`);

      res.status(201).json({
        message: '✅ Registration successful! Please check your email to confirm your account.'
      });
    } catch (emailErr) {
      console.error(`❌ Failed to send email to ${newUser.email}:`, emailErr.message);
      await newUser.destroy();
      return res.status(500).json({ message: 'Failed to send confirmation email. Please try again.' });
    }

  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};


// POST /token
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.token;
  if (!refreshToken) return res.status(403).json({ message: 'Refresh token required' });

  try {
    const tokenInDb = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!tokenInDb) return res.status(403).json({ message: 'Token not found or revoked' });

    const userData = jwt.verify(refreshToken, REFRESH_SECRET);
    const newAccessToken = generateAccessToken({ id: userData.id });
    const newRefreshToken = generateRefreshToken({ id: userData.id });

    tokenInDb.token = newRefreshToken;
    await tokenInDb.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// POST /logout
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

// GET /dashboard
exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'email', 'name'] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// GET /api/auth/confirm-email/:token
exports.confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Invalid or missing token' });
    }

  
     // 1️⃣ Find the user by this confirmation token
    const user = await User.findOne({ where: { confirmationToken: token } });

    if (!user) {
      return res.status(400).send('Invalid or expired confirmation link.');
    }


     // 2️⃣ If already confirmed, avoid re-confirmation
     if (user.isConfirmed) {
      return res.status(200).send('Email is already confirmed. You can log in.');
    }

     // 3️⃣ Update user record
    user.isConfirmed = true;
    user.confirmationToken = null; // optional: clear the token so it can't be reused
    await user.save()
      
        console.log(`✅ Email confirmed for user: ${user.email}`);

    // 4️⃣ Show a nice confirmation message or redirect
    res.status(200).send('✅ Your email has been successfully confirmed! You can now log in.');
    // Or: res.redirect('/login'); if you have a login page
  } catch (error) {
        console.error(`❌ Email confirmation error: ${error.message}`);
        res.status(500).send('Server error while confirming email.');
  }
};

  