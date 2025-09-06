// routes/public.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');

// Middleware
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  next();
}

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Middleware to prevent browser caching
function noCache(req, res, next) {
  res.set("Cache-Control", "no-store");
  next();
}

// Render register page
router.get('/register', checkNotAuthenticated, authController.getRegister);

// Session-based registration
router.post('/register', checkNotAuthenticated, authController.postRegister);

// Render login page
router.get('/login', checkNotAuthenticated, authController.getLogin);

// Session login (Passport local)
router.post('/login', checkNotAuthenticated, authController.postLogin);

// Session logout (requires login)
router.get('/logout', checkAuthenticated, authController.logoutSession);

// EJS session (Passport) dashboard
router.get('/dashboard', checkAuthenticated, noCache, dashboardController.getDashboardPage);

module.exports = router;
