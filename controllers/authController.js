// controllers/authController.js
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const { User, RefreshToken } = require('../models');
const sendEmail = require('../utils/sendEmail'); // adjust path if needed
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');

const SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret';


// GET /register
exports.getRegister = (req, res) => res.render('register');

// POST /register
exports.postRegister = async (req, res) => {
  try {
    const { name, email, cemail, password } = req.body;

    // 1️⃣ Input validation
    if (!name || !email || !cemail || !password) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/register');
    }
    if (email.trim().toLowerCase() !== cemail.trim().toLowerCase()) {
      req.flash('error', 'Emails do not match.');
      return res.redirect('/register');
    }

    // 2️⃣ Check existing user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already registered.');
      return res.redirect('/register');
    }

    // 3️⃣ Hash password & create token
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Build token & save user as you already do...
    const confirmationToken = uuidv4();

    // 4️⃣ Save user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      confirmationToken,
      isConfirmed: false
    });

    console.log(`✅ New user created: ID ${newUser.id}, token ${confirmationToken}`);

    // // 5️⃣ Build confirmation URL
    // const confirmUrl = `${process.env.BASE_URL || `${req.protocol}://${req.get('host')}`}/api/auth/confirm-email/${confirmationToken}`;
    // console.log(`📧 Confirmation URL: ${confirmUrl}`);

    // 6️⃣ Send confirmation email (only once!)
  
      await sendEmail(email, 'Confirm your email', confirmationToken);
      // await sendEmail(email, 'Confirm your email',`Click here to confirm your email:`, confirmationToken);
      
       req.flash('info', 'Registration successful! Please check your email to confirm.');
      return res.redirect('/login');
   
  } catch (err) {
    console.error('❌ Registration error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/register');
   }
};


// GET /login
exports.getLogin = (req, res) => {
  res.render('login', {
  messages: {
  error: req.flash('error'),
  info: req.flash('info'),
  success: req.flash('success')

  // (Keep Passport-based login in routes/public.js)
 }
});
};


// SESSION LOGIN
exports.postLoginSession = (req, res, next) => {
  // This is just a hook after Passport.authenticate succeeds
  req.logIn(req.user, err => {
    if (err) return next(err);

    console.log('✅ Login successful, session before save:', req.session);
    console.log('✅ User:', req.user);

    req.session.save(err => {
      if (err) return next(err);
      req.flash('success', 'Welcome back!');
      return res.redirect('/dashboard');
    });
  });
};


// POST /JWT Login
exports.postLoginJWT = async (req, res) => {
  
  try {
  const { email, password } = req.body; 
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    if (!user.isConfirmed) return res.status(403).json({ message: 'Please confirm your email first' });
      
   const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid email or password' });

  
    // ✅ generate tokens
    const accessToken = generateAccessToken(user);    // probably already synchronous
    const refreshToken = await generateRefreshToken(user);  // already inserts into DB must await! now just returns string

    // ✅ send cookie with refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // req.session.userId = user.id;
    // req.session.isLoggedIn = true;

    return res.json({ accessToken });
  } catch (err) {
    console.error('JWT login error:', err);
    return res.status(500).json({ error: 'Login failed something went wrong. Please try again.' });
  }
};


// POST /token
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.token;
  if (!refreshToken) return res.status(403).json({ message: 'Refresh token required' });

  try {
    const tokenInDb = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!tokenInDb) return res.status(403).json({ message: 'Token not found or revoked' });

    const userData = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = generateAccessToken({ id: userData.id, email: userData.email });
    const newRefreshToken = await generateRefreshToken({ id: userData.id, email: userData.email }); // << Must await create new token in DB

  // update stored token
    tokenInDb.token = newRefreshToken;
    await tokenInDb.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

   return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};


// // GET /api/auth/dashboard
// exports.getDashboard = (req, res) => {
//   res.json({
//     message: 'Welcome to your dashboard',
//     user: req.user
//   });
// };


// // GET /dashboard
// exports.getDashboard = (req, res) => {
//   res.render('dashboard', { user: req.user });
// };

// exports.getDashboard = async (req, res) => {
//   try {
//     const user = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email' ] });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     res.json({ user });
//   } catch (err) {
//     console.error('Dashboard error:', err);
//     res.status(500).json({ error: 'Failed to fetch dashboard data' });
//   }
// };


// POST /logout
exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    req.flash('error', 'No refresh token found.');
    return res.redirect('/login'); }

  try {
    await RefreshToken.destroy({ where: { token: refreshToken } });
    res.clearCookie('refreshToken');

    req.logOut(err => {
      if (err)  console.error('Session logout error:', err);
      console.log('✅ Session logged out');
      req.flash('success', 'Logged out successfully.');
      return res.redirect('/login');
    });
   } catch (err) {
    console.error('Logout error:', err);
    req.flash('error', 'Logout failed.');
    return res.redirect('/dashboard');
   }
};


// GET /api/auth/confirm-email/:token
exports.confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('📩 Incoming confirmation request');
    console.log('Token from URL:', token);

    if (!token) {
      return res.status(400).json({ message: 'Invalid or missing token' });
    }

  
     // 1️⃣ Find the user by this confirmation token
    const user = await User.findOne({ where: { confirmationToken: token } });

    if (!user) {
      console.log('❌ No user found with this token in DB');
      req.flash('error', 'Invalid or expired confirmation link.');
      return res.redirect('/register'); }

  

    console.log('✅ User found in DB:', {
      id: user.id,
      email: user.email,
      confirmationToken: user.confirmationToken,
      isConfirmed: user.isConfirmed
    });

    //  // 2️⃣ If already confirmed, avoid re-confirmation
    //  if (user.isConfirmed) {
    //   return res.status(200).send('Email is already confirmed. You can log in.');
    // }

     // 3️⃣ Update user record
       user.isConfirmed = true; // mark as confirmed
       user.confirmationToken = null; // optional: clear the token so it can't be reused 
       await user.save();
      
        console.log(`✅ Email confirmed for user: ${user.email}`);

    // 4️⃣ Show a nice confirmation message or redirect
    req.flash('success', '✅ Your email has been successfully confirmed! You can now log in.');
      return res.redirect('/login'); 
  } catch (error) {
        console.error(`❌ Email confirmation error: ${error.message}`);
        req.flash('error', 'Could not confirm email.');
    return res.redirect('/register');
  }
};

  