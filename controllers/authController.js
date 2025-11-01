// controllers/authController.js
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const passport = require("passport");

const { User, RefreshToken } = require('../models');
const sendEmail = require('../utils/sendEmail'); // adjust path if needed
const { verifyRefreshToken, generateAccessToken, generateRefreshToken, revokeRefreshToken } = require('../utils/tokenUtils');
// (async () => {
//   const { v4: uuidv4 } = await import('uuid');
//   // your code using uuidv4 here
// })();


const SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret';


// GET /register
exports.getRegister = (req, res) => res.render('register');

// POST /register
exports.postRegister = async (req, res) => {
  try {
    console.log('📥 POST /register body:', req.body);

    const { name, email, cemail, password } = req.body || {};

    // 1️⃣ Basic validation
    if (!name || !email || !password) {
      const msg = 'All fields are required.';
      if (req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ message: msg });
      }
      req.flash('error', msg);
      return res.redirect('/register');
    }

    if (cemail && email.trim().toLowerCase() !== cemail.trim().toLowerCase()) {
      const msg = 'Emails do not match.';
      if (req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ message: msg });
      }
      req.flash('error', msg);
      return res.redirect('/register');
    }

    // 2️⃣ Check existing user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const msg = 'Email is already registered.';
      if (req.headers.accept?.includes('application/json')) {
        return res.status(409).json({ message: msg });
      }
      req.flash('error', msg);
      return res.redirect('/register');
    }

    // 3️⃣ Hash password & create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationToken = uuidv4();

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      confirmationToken,  // Sequelize will save in DB as confirmation_token
      isConfirmed: false, // Sequelize will save in DB as is_confirmed
    });

    console.log(`✅ New user created: ID ${newUser.id}, email: ${newUser.email}`);
    console.log(`📧 Preparing confirmation email with token ${confirmationToken}`);

    // 4️⃣ Send confirmation email (await so you SEE logs before redirect)
    try {
      await sendEmail(
        newUser.email, 
        'Confirm your email', confirmationToken);

  //       newUser.email,
  //   'Confirm your email',
  //   `<p>Click to confirm: <a href="http://localhost:3000/confirm/${confirmationToken}">Confirm Email</a></p>`
  // );
    
      console.log(`📩 Confirmation email sent successfully to ${newUser.email}`);
    } catch (mailErr) {
      console.error('❌ sendEmail() failed:', mailErr.message || mailErr);
    }

    // 5️⃣ Decide response
    if (req.headers.accept?.includes('application/json')) {
      return res
        .status(201)
        .json({ message: 'Registration successful. Please check your email to confirm.' });
    } else {
      req.flash('info', 'Registration successful! Please check your email to confirm.');
      return res.redirect('/login');
    }
  } catch (err) {
    console.error('❌ Registration error:', err);
    if (req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ message: 'Registration failed', error: err.message });
    }
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
exports.postLogin = async (req, res) => {
  try {
    console.log('📥 POST /login body:', req.body);

    const { email, password } = req.body;

    console.log('🟢 Login attempt for:', email);

    // Basic validation
    if (!email || !password) {
      const msg = 'Email and password are required';
      if (req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ error: msg });
      }
      req.flash('error', msg);
      return res.redirect('/login');
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const msg = 'Invalid email or password';
      if (req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: msg });
      }
      req.flash('error', msg);
      return res.redirect('/login');
    }

    // Confirm email
    if (!user.isConfirmed) {
      const msg = 'Please confirm your email first';
      if (req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ error: msg });
      }
      req.flash('error', msg);
      return res.redirect('/login');
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const msg = 'Invalid email or password';
      if (req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: msg });
      }
      req.flash('error', msg);
      return res.redirect('/login');
    }

    req.login(user, async (err) => {
      if (err) {
        console.error('🔥 req.login error:', err)
        return next(err);
      }
      
    // ✅ Generate JWT tokens using utils
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    console.log(`✅ User ${email} logged in successfully`);
    console.log(`📌 Access token length (15): ${accessToken.length}`);
    console.log(`📌 Refresh token length (7d): ${refreshToken.length}`);

    // ✅ Store tokens as cookies (optional)
    res.cookie('accessToken', accessToken, {
      httpOnly: false, // readable by frontend if you want
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' for cross-site in prod (with HTTPS), 'Lax' in dev
      path: "/",
      maxAge: 15 * 60 * 1000,  // 15 min
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // only backend can read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' for cross-site in prod (with HTTPS), 'Lax' in dev
      maxAge: 1000 * 60 * 60 * 24,  // 1 days
      path: "/",
    });
    

    // ✅ 👉 Decide response depending on request type
    // Check if request expects JSON (API) or HTML (EJS form submit)
    if (req.headers.accept?.includes('application/json')) {
      // For fetch / API client (fetch/AJAX)
      return res.status(200).json({
        message: 'Login successful',
        accessToken,
        refreshToken,
      });
    } else {
      // Browser form → use session + redirect (HTML/EJS) for normal EJS form submission
      req.flash('success', 'Welcome back!');
      return res.redirect('/dashboard');
    }
  });

  } catch (err) {
    console.error('🔥 Login error:', err);
    if (req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ error: 'Internal server error'  });
    }
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/login');
  }
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
      httpOnly: true, // only backend can read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
      maxAge: 1000 * 60 * 60 * 24,  // 1 days
      path: "/",
    });

   return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Unified logout - handles both session + JWT
exports.unifiedLogout = async (req, res) => {
  try {
    // --- SESSION LOGOUT ---
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log("🔒 Logging out Session user...");
      await new Promise((resolve) => {
        req.logout((err) => {
          if (err) console.error("Session logout error:", err);

          req.session.destroy(() => {
            res.clearCookie("connect.sid", {
              path: "/", // <= MUST match session cookie path
              secure: process.env.NODE_ENV === "production",
              httpOnly: true, // JS can’t touch cookies
              sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict", // 'None' for cross-site in prod (with HTTPS), 'Strict' in dev
            });
            console.log("✅ Session destroyed & cookie cleared & user logged out");
            resolve();
          });
        });
      });
    }

    // --- JWT LOGOUT ---
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      console.log("🔑 Revoking JWT refresh token...");
      try {
        await revokeRefreshToken(refreshToken);
      } catch (e) {
        console.warn("❌ Failed to revoke token:", e);
      }
    }

    // Clear cookie regardless (match path & options used when setting it)
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
      path: "/",
    });
    console.log("✅ JWT cookie cleared");

    // --- RESPONSE ---
    if (req.headers.accept?.includes("application/json")) {
      return res.json({ message: "Logged out successfully", redirect: "/login" });
    }
    return res.redirect("/login");

  } catch (err) {
    console.error("Unified logout error:", err);
    if (req.headers.accept?.includes("application/json")) {
      return res.status(500).json({ message: "Logout failed." });
    }
    return res.redirect("/login");
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