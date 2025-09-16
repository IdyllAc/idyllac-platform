// routes/profile.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController')
const noCache = require("../middleware/noCache");
const authenticateToken = require('../middleware/jwtMiddleware');
const {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings
} = require('../controllers/profileController');

// Profile routes
router.get('/profile', authenticateToken, noCache, profileController.getProfile);
router.post('/profile', authenticateToken, noCache, profileController.updateProfile);


// Settings routes
router.get('/sittings', authenticateToken, noCache, profileController.getSittings);
router.post('/sittings', authenticateToken, noCache, profileController.updateSettings);


module.exports = router;


