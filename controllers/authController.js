// controllers/authController.js
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const { User, RefreshToken } = require('../models/User');
const { sendConfirmationEmail } = require('../utils/sendEmail');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');

const SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret';

// GET /login
exports.getLogin = (req, res) => res.render('login');

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
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // 3️⃣ Hash password & create token
    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationToken = uuidv4();

    // 4️⃣ Save user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      is_confirmed: false,
      confirmation_token: confirmationToken
    });

    // 5️⃣ Send confirmation email
    if (!process.env.BASE_URL) {
      console.error('❌ BASE_URL not set in environment variables.');
      // Clean up the user record before error
      await newUser.destroy();
      return res.status(500).json({ message: 'Server error. Try later.' });
    }

    console.log('📧 Register route hit, sending confirmation email to', newUser.email);
    try {
      await sendConfirmationEmail(newUser.email, confirmationToken);
      console.log('✅ Email function completed.');
      res.status(201).json({
      message: '✅ Registration successful! Please check your email to confirm your account.'
    });
    } catch (emailErr) {
      console.error('❌ Email sending failed, removing unconfirmed user:', emailErr.message);
    
      // await newUser.destroy();
      await newUser.destroy(); // Delete user if email send fails
      return res.status(500).json({ message: 'Failed to send confirmation email. Please try again..' });
    }
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.redirect("/register");
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

// GET /confirm/:token
exports.confirmEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ where: { confirmation_token: token } });
    if (!user) {
      req.flash('error', 'Invalid or expired confirmation token.');
      return res.redirect('/login');
    }
    user.is_confirmed = true;
    user.confirmation_token = null;
    await user.save();

    req.flash('info', 'Your email has been successfully confirmed. You can now log in.');
    res.redirect('/login?confirmed=true');
  } catch (err) {
    console.error('Email confirmation error:', err);
    req.flash('error', 'Something went wrong. Please try again later.');
    res.redirect('/login');
  }
};
