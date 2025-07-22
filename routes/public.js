// routes/public.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/jwtMiddleware'); // ✅ Correct: import as a function

// Middleware
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/');
  next();
}

// Routes
router.get('/register', checkNotAuthenticated, authController.getRegister);
router.post('/register', checkNotAuthenticated, authController.postRegister);

router.get('/login', checkNotAuthenticated, authController.getLogin);
router.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

router.delete('/logout', authController.logout);

module.exports = router;
