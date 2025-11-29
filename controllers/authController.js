// controllers/authController.js
const passport = require("passport");
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
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
        'Confirm your email', 
        confirmationToken
      );

  //       newUser.email,
  //   'Confirm your email',
  //   `<p>Click to confirm: <a href="http://localhost:3000/confirm/${confirmationToken}">Confirm Email</a></p>`
  // );
    
      console.log(`📩 Confirmation email sent successfully to ${newUser.email}`);
    } catch (mailErr) {
      console.error('❌ sendEmail() failed:', mailErr.message || mailErr);
    }

    // // 5️⃣ Decide response
    // if (req.headers.accept?.includes('application/json')) {
    //   return res
    //     .status(201)
    //     .json({ message: 'Registration successful. Please check your email to confirm.' });
    // } else {
      req.flash('info', 'Registration successful! Please check your email to confirm.');
      return res.redirect('/login');
    // }
  } catch (err) {
    console.error('❌ Registration error:', err);
    if (req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ message: 'Registration failed', error: err.message });
    }
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/register');
  }
};

// ---------------------LOGIN (EJS + JWT)----------------------------
// GET /login
exports.getLoginForm = (req, res) => {
  res.render('login', {
  messages: {
  error: req.flash('error'),
  info: req.flash('info'),
  success: req.flash('success')
 }
});
};


/**
 * Session-based login (form POST -> /login)
 * Uses req.login() and redirects to /dashboard
 */
exports.postLoginForm = (req, res, next) => {
  console.log('📥 POST /login (form) attempt:', req.body.email);

  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      console.error('🔥 Passport error:', err);
      return next(err);
    }

    if (!user) {
      const msg = info?.message || 'Invalid email or password';
      if (req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: msg });
      }
      req.flash('error', msg);
      return res.redirect('/login');
    }

    // console.log("req.login() user:", user);

    // Establish session for this user
    req.login(user, async (err) => {
      if (err) {
        console.error('🔥 req.login error:', err);
        return next(err);
      }

      console.log('✅ Session created for user:', user.email);
      

      // if (!req.user) {
      //   console.warn('⚠️ req.user not set after req.login, forcing manual attach');
      //   req.user = user; // Fallback (rarely needed)
      // }

       // 🔑 Generate JWT tokens *after* session is created
       const accessToken = generateAccessToken(user);
       const refreshToken = await generateRefreshToken(user);

        // Optional: send access token to front-end for API calls
        res.cookie('accessToken', accessToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
          path: '/',
          maxAge: 15 * 60 * 1000,
        });
 
 
       // Save refresh token cookie
       res.cookie('refreshToken', refreshToken, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
         path: '/',
         maxAge: 7 * 24 * 60 * 60 * 1000,
       });
      
       // at this point session is established
       req.flash('success', 'Welcome back!');
       return res.redirect('/dashboard');
   });
 })(req, res, next);
}


/**
 * API-based login (fetch -> /api/auth/login)
 * No req.login (no session). Returns JSON tokens.
 */
exports.postLoginApi = (req, res, next) => {
  console.log('📥 POST /api/auth/login attempt:', req.body.email);

  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      console.error('🔥 Passport error (API):', err);
      return next(err);
    }

    if (!user) {
      const msg = info?.message || 'Invalid email or password';
      return res.status(401).json({ error: msg });
    }

    try {
      // Confirm email status
      if (!user.isConfirmed) {
        return res.status(403).json({ error: 'Please confirm your email first' });
      }

      console.log('✅ User authenticated:', user.email);

      // Generate JWT tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user);

      // console.log(`✅ User ${user.email} logged in successfully`);
      // console.log(`📌 Access token length (15): ${accessToken.length}`);
      // console.log(`📌 Refresh token length (7d): ${refreshToken.length}`);

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });

      return res.status(200).json({
        message: 'Login successful',
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.error('🔥 Login API error:', err);
      return next(err);
    }
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
      httpOnly: true, // only backend can read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax',
      path: "/",
      maxAge: 1000 * 60 * 60 * 24,  // 1 days
    });

   return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};



// // SAFETY PATCH for Passport <-> Passport-OAuth conflicts
// if (!req.logout.length) {
//   // If logout has no callback argument, wrap it
//   const orig = req.logout;
//   req.logout = (cb) => {
//     try {
//       orig.call(req);
//       cb && cb();
//     } catch (e) {
//       cb && cb(e);
//     }
//   };
// }


// Unified logout - handles both session + JWT
exports.unifiedLogout = async (req, res) => {
  try {
    // --- SESSION LOGOUT ---
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log("🔒 Logging out Session user...");

      await new Promise((resolve) => {
        // Passport 0.6+ requires a callback
        req.logout((err) => {
          if (err) {
            console.error("Session logout error:", err);
          }

        // Defensive patch: ensure req.user is cleared even if an adapter uses old API
      req.user = null;

          req.session.destroy(() => {
            res.clearCookie("connect.sid", {
              path: "/", // <= MUST match session cookie path
              secure: process.env.NODE_ENV === "production",
              httpOnly: true, // JS can’t touch cookies
              sameSite: process.env.NODE_ENV === "production" ? "None" : "lax", // 'None' for cross-site in prod (with HTTPS), 'lax' in dev
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
      sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
      path: "/",
    });
    console.log("✅ JWT cookie cleared");

    res.clearCookie("accessToken", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });
    console.log("✅ Access token cookie cleared");

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
      return res.redirect('/register');
    }

  
     // 1️⃣ Find the user by this confirmation token
    const user = await User.findOne({ where: { confirmationToken: token } });

    if (!user) {
      console.log('❌ No user found with this token in DB');
      req.flash('error', 'Invalid or expired confirmation link.');
      return res.redirect('/register'); 
    }

      
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





// // controllers/authController.js
// const passport = require("passport");
// const bcrypt = require('bcrypt');
// const { v4: uuidv4 } = require('uuid');
// const jwt = require('jsonwebtoken');
// const { User, RefreshToken } = require('../models');
// const sendEmail = require('../utils/sendEmail');
// const {
//   verifyRefreshToken,
//   generateAccessToken,
//   generateRefreshToken,
//   revokeRefreshToken
// } = require('../utils/tokenUtils');

// const SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_jwt_secret';
// const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret';

// // ---------------- REGISTER ----------------
// exports.getRegister = (req, res) => res.render('register');

// exports.postRegister = async (req, res) => {
//   try {
//     const { name, email, cemail, password } = req.body;

//     if (!name || !email || !password) {
//       const msg = 'All fields are required.';
//       req.flash('error', msg);
//       return res.redirect('/register');
//     }

//     if (cemail && email.trim().toLowerCase() !== cemail.trim().toLowerCase()) {
//       const msg = 'Emails do not match.';
//       req.flash('error', msg);
//       return res.redirect('/register');
//     }

//     const existingUser = await User.findOne({ where: { email } });
//     if (existingUser) {
//       req.flash('error', 'Email is already registered.');
//       return res.redirect('/register');
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const confirmationToken = uuidv4();

//     const newUser = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       confirmationToken,
//       isConfirmed: false
//     });

//     await sendEmail(
//       newUser.email,
//       'Confirm your email',
//       confirmationToken
//     );

//     req.flash('info', 'Registration successful! Please check your email to confirm.');
//     return res.redirect('/login');
//   } catch (err) {
//     console.error('❌ Registration error:', err);
//     req.flash('error', 'Something went wrong. Please try again.');
//     return res.redirect('/register');
//   }
// };

// // ---------------- LOGIN (EJS + JWT) ----------------
// exports.getLoginForm = (req, res) => {
//   res.render('login', {
//     messages: {
//       error: req.flash('error'),
//       info: req.flash('info'),
//       success: req.flash('success')
//     }
//   });
// };

// exports.postLoginForm = (req, res, next) => {
//   passport.authenticate('local', async (err, user, info) => {
//     if (err) {
//       console.error('🔥 Passport error:', err);
//       return next(err);
//     }

//     if (!user) {
//       req.flash('error', info?.message || 'Invalid email or password');
//       return res.redirect('/login');
//     }

//     req.login(user, async (err) => {
//       if (err) {
//         console.error('🔥 req.login error:', err);
//         return next(err);
//       }

//       console.log('✅ Session created for:', user.email);

//       // Generate tokens along with session
//       const accessToken = generateAccessToken(user);
//       const refreshToken = await generateRefreshToken(user);

//       // Save cookies
//       res.cookie('accessToken', accessToken, {
//         httpOnly: false,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
//         path: '/',
//         maxAge: 15 * 60 * 1000,
//       });

//       res.cookie('refreshToken', refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
//         path: '/',
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//       });

//       req.flash('success', 'Welcome back!');
//       return res.redirect('/dashboard');
//     });
//   })(req, res, next);
// };

// // ---------------- LOGIN (API) ----------------
// exports.postLoginApi = (req, res, next) => {
//   passport.authenticate('local', async (err, user, info) => {
//     if (err) return next(err);
//     if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials' });

//     if (!user.isConfirmed) {
//       return res.status(403).json({ error: 'Please confirm your email first' });
//     }

//     const accessToken = generateAccessToken(user);
//     const refreshToken = await generateRefreshToken(user);

//     res.cookie('accessToken', accessToken, {
//       httpOnly: false,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
//       path: '/',
//       maxAge: 15 * 60 * 1000,
//     });

//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
//       path: '/',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     return res.status(200).json({
//       message: 'Login successful',
//       accessToken,
//       refreshToken,
//     });
//   })(req, res, next);
// };

// // ---------------- REFRESH ----------------
// exports.refreshToken = async (req, res) => {
//   try {
//     const refreshToken = req.cookies.refreshToken;
//     if (!refreshToken) return res.status(403).json({ message: 'Refresh token required' });

//     const userData = verifyRefreshToken(refreshToken);
//     await revokeRefreshToken(refreshToken);

//     const newAccessToken = generateAccessToken(userData);
//     const newRefreshToken = await generateRefreshToken(userData);

//     res.cookie('refreshToken', newRefreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax',
//       path: '/',
//       maxAge: 1000 * 60 * 60 * 24,
//     });

//     return res.json({ accessToken: newAccessToken });
//   } catch (err) {
//     console.error('Refresh error:', err);
//     return res.status(403).json({ error: 'Invalid or expired token' });
//   }
// };

// // ---------------- LOGOUT ----------------
// exports.unifiedLogout = async (req, res) => {
//   try {
//     if (req.isAuthenticated && req.isAuthenticated()) {
//       await new Promise((resolve) => {
//         req.logout((err) => {
//           if (err) console.error("Session logout error:", err);
//           req.session.destroy(() => {
//             res.clearCookie("connect.sid");
//             resolve();
//           });
//         });
//       });
//     }

//     const refreshToken = req.cookies?.refreshToken;
//     if (refreshToken) await revokeRefreshToken(refreshToken);

//     res.clearCookie('refreshToken', { path: '/' });
//     res.clearCookie('accessToken', { path: '/' });

//     if (req.headers.accept?.includes('application/json')) {
//       return res.json({ message: 'Logged out successfully', redirect: '/login' });
//     }
//     return res.redirect('/login');
//   } catch (err) {
//     console.error("Logout error:", err);
//     if (req.headers.accept?.includes("application/json")) {
//       return res.status(500).json({ message: "Logout failed." });
//     }
//     return res.redirect("/login");
//   }
// };

// // ---------------- EMAIL CONFIRM ----------------
// exports.confirmEmail = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const user = await User.findOne({ where: { confirmationToken: token } });

//     if (!user) {
//       req.flash('error', 'Invalid or expired confirmation link.');
//       return res.redirect('/register');
//     }

//     if (user.isConfirmed) {
//       req.flash('info', 'Email already confirmed. Please log in.');
//       return res.redirect('/login');
//     }

//     user.isConfirmed = true;
//     user.confirmationToken = null;
//     await user.save();

//     req.flash('success', '✅ Email confirmed! You can now log in.');
//     return res.redirect('/login');
//   } catch (err) {
//     console.error('Email confirmation error:', err);
//     req.flash('error', 'Could not confirm email.');
//     return res.redirect('/register');
//   }
// };
