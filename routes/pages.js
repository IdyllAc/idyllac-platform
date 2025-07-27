// routes/pages.js
const express = require('express');
const router = express.Router();
const { checkAuthenticated, checkNotAuthenticated } = require('../middlewares/jwtMiddleware');

// Home
router.get('/', (req, res) => res.render('index'));

// Register
router.get('/register', checkNotAuthenticated, (req, res) => res.render('register'));

// Login
router.get('/login', checkNotAuthenticated, (req, res) => res.render('login'));

// Dashboard (Session-protected)
router.get('/dashboard', checkAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// Profile & Settings
router.get('/profile', checkAuthenticated, (req, res) => res.render('profile', { user: req.user }));
router.get('/settings', checkAuthenticated, (req, res) => res.render('settings', { user: req.user }));

module.exports = router;


