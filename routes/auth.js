// routes/auth.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { checkNotAuthenticated } = require('../middleware/authMiddleware');
const authenticateToken = require('../middleware/jwtMiddleware');
const dashboardController = require('../controllers/dashboardController');
// const checkAuthenticated = require('../middleware/authMiddleware'); // for session login


// 🔹 API: Register (returns JSON)
router.post('/register', authController.postRegister);

// SESSION LOGIN
router.post('/login', checkNotAuthenticated, authController.postLogin);

// SESSION LOGOUT
router.delete('/logout', (req, res, next) => {
  req.logOut(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});


// 🔹 API: Login (returns JSON with tokens)
router.post('/api/login', authController.postLogin);

// 🔹 API: Refresh token
router.post('/refresh-token', authController.refreshToken);

// 🔹 API: Logout (invalidate refresh token)
router.post('/logout', authController.logoutJWT);

 // EJS session (passport) dashboard 
 // router.get('/dashboard/page', checkAuthenticated, dashboardController.getDashboardPage);


// API dashboard (JWT protected)
router.get('/dashboard', authenticateToken, dashboardController.getDashboardApi);


// 🔹 API: Email confirmation
router.get('/confirm-email/:token', authController.confirmEmail);

module.exports = router;
