// routes/profile.js
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { validationResult } = require('express-validator');

const combinedAuth = require('../middleware/combinedAuth');
const noCache = require('../middleware/noCache');
const profileController = require('../controllers/profileController');
// const uploadProfilePhoto = require('../middleware/uploadProfilePhoto');
const { validateProfile } = require('../validators/profileValidator');
const { validateSettings } = require('../validators/settingsValidator');


// 🗂️ Multer configuration for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/profile_photos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  }
});

const upload = multer({
storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// 🧍‍♂️ Profile routes 

// Render profile page (EJS)
router.get('/', combinedAuth, noCache, (req, res) => {
  res.render('profile', { user: req.user });
});

// 🧠 Get profile data (JSON)
router.get('/data', combinedAuth, profileController.getProfile);

// 🟢 Profile routes 
// Update or create profile
router.post(
  '/api',
  combinedAuth,
  noCache,
  upload.single('profile_photo'),
  // 🧩 Middleware to flatten fields that arrive as arrays
  (req, res, next) => {
    for (const key in req.body) {
      if (Array.isArray(req.body[key])) {
        req.body[key] = req.body[key][0]; // flatten to a string
      }
    }
    next();
  },
  profileController.updateProfile
);


// 🟢 Settings routes 

// Render settings page
router.get('/settings', combinedAuth, noCache, (req,res) => {
  res.render('settings', { user: req.user});  
});

// Get settings data (JSON)
router.get('/settings/data', combinedAuth, noCache, profileController.getSettingsData);


// Update settings
router.post(
  '/settings', 
  combinedAuth, 
  noCache, 
  validateSettings, 
  (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}, 
profileController.updateSettings
);

module.exports = router;
