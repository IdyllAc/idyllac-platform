// routes/auth.js

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/jwtMiddleware');

// register route
router.post('/register', authController.postRegister);
// login route
router.post('/login', authController.postLogin);
// Refresh token route
router.post('/refresh-token', authController.refreshToken);
// Logout route
router.post('/logout', authController.logout);
// Protected dashboard route
router.get('/dashboard', authenticateToken, authController.getDashboard);
// Email confirmation route
router.get('/confirm-email/:token', authController.confirmEmail);

  module.exports = router;