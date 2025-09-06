// controllers/authController.js
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const passport = require("passport");

const { User, RefreshToken } = require('../models');
const sendEmail = require('../utils/sendEmail'); // adjust path if needed
const { verifyRefreshToken, generateAccessToken, generateRefreshToken, revokeRefreshToken } = require('../utils/tokenUtils');

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

    // 6️⃣ Send confirmation email (only once,let sendEmail build the URL)
      await sendEmail(email, 'Confirm your email', confirmationToken);
      
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
 }
});
};


// POST /login (for both EJS + API style)
exports.postLogin = (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    req.login(user, async (err) => {
      if (err) return next(err);

      try {
        // ✅ Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

       // // ✅ Save access token in HttpOnly cookie
        res.cookie('accessToken', accessToken, {
          httpOnly: false, // frontend JS needs access
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          maxAge: 15 * 60 * 1000, // 15 min
        });

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true, // refresh stays hidden from JS
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        

        // Check if request expects JSON (API) or HTML (EJS form submit)
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          // API client → send tokens in JSON
          return res.json({
            message: 'Login successful',
            accessToken,
            refreshToken
          });
        } else {
          // Browser form → use session + redirect
          req.flash('success', 'Welcome back!');
          return res.redirect('/dashboard');
        }

      } catch (tokenErr) {
        console.error("❌ Token generation failed:", tokenErr);
        return res.status(500).json({ message: "Login failed, token error" });
      }
    });
  })(req, res, next);
};


// Refresh token controller
exports.refreshToken = async (req, res) => {
  try {
  const refreshToken = req.cookies.refreshToken 
  if (!refreshToken) return res.status(403).json({ message: 'Refresh token required' });
  

     // ✅ Verify refresh token (throws if invalid/expired)
    const userData = verifyRefreshToken(refreshToken);

    // ✅ Revoke old token
    await revokeRefreshToken(refreshToken);

    // Generate new tokens
    const newAccessToken = generateAccessToken(userData);
    const newRefreshToken = await generateRefreshToken(userData); 


      // Send new refresh token as HttpOnly cookie
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


// SESSION LOGOUT
exports.logoutSession = (req, res) => {
  req.logout(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Logout failed");
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // clear session cookie
      console.log("✅ Session destroyed & cookie cleared");
      return res.redirect("/login");  // redirect
    });
  });
};


// POST /logout
exports.logoutJWT = async (req, res) => {
  try {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ message: 'No refresh token found.' });
  }

    // ✅ Use utility to revoke token from DB
    await revokeRefreshToken(refreshToken);

      // Clear cookie
    res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
   });

   return res.json({ message: 'Logged out successfully.', redirect: '/login' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Logout failed.' });
  }
};


// GET /api/auth/confirm-email/:token
exports.confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('📩 Incoming confirmation request');
    console.log('Token from URL:', token);

    if (!token) {
      req.flash('error', 'Invalid or missing confirmation token.');
      return res.redirect('/register');}

  
     // 1️⃣ Find the user by this confirmation token
    const user = await User.findOne({ where: { confirmationToken: token } });

    if (!user) {
      console.log('❌ No user found with this token in DB');
      req.flash('error', 'Invalid or expired confirmation link.');
      return res.redirect('/register'); }

      
    console.log('✅ User found in DB:', {
      id: user.id,
      email: user.email,
      isConfirmed: user.isConfirmed,
      confirmationToken: user.confirmationToken
    });

    // 2️⃣ If already confirmed, avoid re-confirmation
    if (user.isConfirmed) {
      console.log(`ℹ️ User ${user.email} already confirmed`);
      req.flash('info', 'Email is already confirmed. You can log in.');
      return res.redirect('/login');
    }
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
        req.flash('error', 'Something went wrong could not confirm email.');
    return res.redirect('/register');
  }
};

  