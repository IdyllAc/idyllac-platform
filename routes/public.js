// routes/public.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// Middleware to prevent logged-in users from visiting login/register pages
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  next();
}

// Middleware to ensure user is logged in (for page-based routes)
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// 🔹 Render register page
router.get('/register', checkNotAuthenticated, authController.getRegister);

// 🔹 Session-based registration (redirects)
router.post('/register', checkNotAuthenticated, authController.postRegister);

// 🔹 Render login page
router.get('/login', checkNotAuthenticated, authController.getLogin);

// 🔹 Session-based login
router.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

// 🔹 Page-based logout (destroy session)
router.delete('/logout', (req, res, next) => {
  req.logOut(err => {
    if (err) return next(err);
    console.log('✅ Session logged out');
    res.redirect('/login');
  });
});

// 🔹 Render dashboard page (session-based)
router.get('/dashboard', checkAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

module.exports = router;
