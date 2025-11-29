// routes/auth.js
const express = require('express');
const router = express.Router();
const apiAuthController = require('../controllers/authController');
const jwtMiddleware = require('../middleware/jwtMiddleware');
const dashboardController = require('../controllers/dashboardController');
const socialController = require('../controllers/socialController');
const noCache = require('../middleware/noCache');

// API: Register (JSON)
router.post('/register', apiAuthController.postRegister);

// API: Login (JSON)
router.post('/api/auth/login', apiAuthController.postLoginApi);

// API: Refresh token
router.post('/refresh-token', apiAuthController.refreshToken);

// // API: Logout (invalidate refresh token)
// router.post('/logout', authController.logoutJWT);

// API: Logout (session + JWT unified)
router.post('/logout', apiAuthController.unifiedLogout);


// API: Dashboard (JWT protected)
router.get('/dashboard', jwtMiddleware, noCache, dashboardController.getDashboardApi);

// API: Session fallback (for users authenticated via Passport)
router.get('/session', dashboardController.getSessionApi);

// API: Email confirmation
router.get('/confirm-email/:token', apiAuthController.confirmEmail);

// TikTok Callback
router.get('/tiktok/callback', socialController.tiktokCallback);


module.exports = router;
