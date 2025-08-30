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

// // Middleware to ensure user is logged in (for page-based routes)
// function checkAuthenticated(req, res, next) {
//   if (req.isAuthenticated && req.isAuthenticated()) return next();
//   res.redirect('/login');
// }


// 🔹 Render register page
router.get('/register', checkNotAuthenticated, authController.getRegister);

// 🔹 Session-based registration (redirects)
router.post('/register', checkNotAuthenticated, postRegister);

// 🔹 Render login page
router.get('/login', checkNotAuthenticated, authController.getLogin);

// 🔹 Session-based login
router.post('/login', checkNotAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }
    req.user = user; // attach for controller
    return postLoginSession(req, res, next);
  })(req, res, next);
});

// 🔹 Page-based logout (session)
router.delete('/logout', (req, res, next) => {
  req.logOut(err => {
    if (err) return next(err);
    console.log('✅ Session logged out');
    res.redirect('/login');
  });
});


//  // in public.js
// router.get('/dashboard/page', checkAuthenticated, (req, res) => {
//   res.render('dashboard');  // no `.ejs` needed
//  });


module.exports = router;
