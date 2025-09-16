const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/jwtMiddleware');
const uploadController = require('../controllers/uploadController');
const personalInfoController = require('../controllers/personalInfoController');
const noCache = require('../middleware/noCache');
const { completeRegistration } = require('../controllers/registrationController');
const { PersonalInfo, UserProfile, UserSettings, Document, Selfie } = require('../models');

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.user.id;
    const userDir = path.join(__dirname, '..', 'uploads', String(userId));
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname === 'selfie' ? 'selfie-temp.jpg' : file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Show Personal Info form
router.get(
  '/personal_info', 
  authenticateToken, 
  noCache, 
  (req, res) => {
  res.render('personal', { user: req.user });
});

// Submit Personal Information
router.post('/personal_info', 
  authenticateToken, 
  noCache, 
  personalInfoController.submitPersonalInfo);

// Show Upload Document form
router.get(
  '/upload/document',
  authenticateToken,
  noCache,
  (req, res) => {
    res.render('document', { user: req.user });
  }
);


// ✅ Route: Upload Documents
router.post(
  '/upload/document',
  authenticateToken,
  noCache, 
  upload.fields([
    { name: 'passport_path', maxCount: 1 },
    { name: 'id_card_path', maxCount: 1 },
    { name: 'license_path', maxCount: 1 }
  ]),
  uploadController.uploadDocuments
);


// Show Upload Selfie
router.get(
  '/upload/selfie',
  authenticateToken,
  noCache,
  (req, res) => {
    res.render('selfie', { user: req.user });
  }
);


// ✅ Route: Upload Selfie
router.post(
  '/upload/selfie',
  authenticateToken, 
  noCache, upload.single('selfie'),
  uploadController.uploadSelfie
);


router.get('/completed', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const personalInfo = await PersonalInfo.findOne({ where: { userId } });

  // Example file names saved during upload
  const documents = {
    passport: 'passport.jpg',
    id_card: 'id_card.jpg',
    license: 'license.jpg'
  };

  const selfiePath = 'selfie-temp.jpg'; // or 'selfie.jpg' after confirm

  res.render('completed', { 
    user: req.user,
    personalInfo,
    documents,
    selfiePath
  });
});


router.get('/review-progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const personalInfo = await PersonalInfo.findOne({ where: { userId } });
    const profile     = await UserProfile.findOne({ where: { userId } });
    const settings    = await UserSettings.findOne({ where: { userId } });
    const documents   = await Document.findOne({ where: { userId } });
    const selfie      = await Selfie.findOne({ where: { userId } });

    let progress = 0;
    if (personalInfo) progress += 20;
    if (profile) progress += 20;
    if (settings) progress += 20;
    if (documents) progress += 20;
    if (selfie) progress += 20;

    res.json({ progress });
  } catch (err) {
    console.error('💥 Error in review-progress:', err);
    res.status(500).json({ error: 'Failed to calculate progress' });
  }
});


// ✅ Final step: complete registration
router.post('/complete', authenticateToken, completeRegistration);



module.exports = router;
