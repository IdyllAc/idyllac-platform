// routes/auth.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/jwtMiddleware');

// 🔹 API: Register (returns JSON)
router.post('/register', authController.postRegister);

// 🔹 API: Login (returns JSON with tokens)
router.post('/login', authController.postLogin);

// 🔹 API: Refresh token
router.post('/refresh-token', authController.refreshToken);

// 🔹 API: Logout (invalidate refresh token)
router.post('/logout', authController.logout);

// 🔹 API: Protected dashboard (JWT only)
router.get('/dashboard', authenticateToken, authController.getDashboard);

// 🔹 API: Email confirmation
router.get('/confirm-email/:token', authController.confirmEmail);

module.exports = router;
