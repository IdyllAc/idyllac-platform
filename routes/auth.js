// routes/auth.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/jwtMiddleware');
const dashboardController = require('../controllers/dashboardController');

// API: Register (JSON)
router.post('/register', authController.postRegister);

// API: Login (returns JWTs)
router.post('/login', authController.postLogin);

// API: Refresh token
router.post('/refresh-token', authController.refreshToken);

// API: Logout (invalidate refresh token)
router.post('/logout', authController.logoutJWT);

// API: Dashboard (JWT protected)
router.get('/dashboard', authenticateToken, dashboardController.getDashboardApi);

// API: Email confirmation
router.get('/confirm-email/:token', authController.confirmEmail);

module.exports = router;
