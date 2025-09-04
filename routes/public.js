// routes/public.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const { postRegister, postLoginSession, getDashboard } = require('../controllers/authController');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');


// Middleware to prevent logged-in users from visiting login/register pages
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  next();
}

// 🔹 Render register page
router.get('/register', checkNotAuthenticated, authController.getRegister);

// 🔹 Session-based registration (redirects)
router.post('/register', checkNotAuthenticated, postRegister);

// 🔹 Render login page
router.get('/login', checkNotAuthenticated, authController.getLogin);


// Session-based login
router.post('/login', checkNotAuthenticated, authController.postLogin);


// 🔹 Page-based logout (session)
router.delete('/logout', (req, res, next) => {
  req.logOut(err => {
    if (err) return next(err);
    console.log('✅ Session logged out');
    res.redirect('/login');
  });
});


module.exports = router;
