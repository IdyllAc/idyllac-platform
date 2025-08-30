// routes/auth.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/jwtMiddleware');
const dashboardController = require('../controllers/dashboardController');
// const checkAuthenticated = require('../middleware/authMiddleware'); // for session login


// 🔹 API: Register (returns JSON)
router.post('/register', authController.postRegister);

// 🔹 API: Login (returns JSON with tokens)
router.post('/login', authController.postLoginJWT);

// 🔹 API: Refresh token
router.post('/refresh-token', authController.refreshToken);

// 🔹 API: Logout (invalidate refresh token)
router.post('/logout', authController.logout);

 // EJS session (passport) dashboard 
 // router.get('/dashboard/page', checkAuthenticated, dashboardController.getDashboardPage);


// API dashboard (JWT protected)
router.get('/api/dashboard', authenticateToken, dashboardController.getDashboardApi);


// 🔹 API: Email confirmation
router.get('/confirm-email/:token', authController.confirmEmail);

module.exports = router;
