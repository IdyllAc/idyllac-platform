const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authenticateToken = require('../middleware/jwtMiddleware');
const noCache = require('../middleware/noCache');

const uploadController = require('../controllers/uploadController');
const personalInfoController = require('../controllers/personalInfoController');
const { completeRegistration, showCompletedPage } = require('../controllers/registrationController');


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

// ✅ Show Personal Info form
router.get('/personal_info', authenticateToken, noCache, (req, res) => {
  res.render('personal', { user: req.user });
});

// ✅ Submit Personal Info form
router.post('/personal_info', authenticateToken, noCache, personalInfoController.submitPersonalInfo);

// ✅ Show Upload Document form
router.get('/upload/document', authenticateToken, noCache, (req, res) => {
    res.render('document', { user: req.user });
  });


// ✅ Upload Documents
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


// ✅ Show Upload Selfie form
router.get('/upload/selfie', authenticateToken, noCache, (req, res) => {
    res.render('selfie', { user: req.user });
  }
);


// ✅ Upload Selfie
router.post(
  '/upload/selfie', 
  authenticateToken, 
  noCache, 
  upload.single('selfie'),
  uploadController.uploadSelfie
);


// ✅ Completed Page (from controller)
router.get('/completed', authenticateToken, showCompletedPage);

// ✅ Final step: Complete Registration
router.post('/complete', authenticateToken, completeRegistration);

// ✅ Review Progress
router.get('/review-progress', authenticateToken, async (req, res) => {
  try {
    const { PersonalInfo, Document, Selfie } = require('../models');
    const userId = req.user.id;

    const personalInfo = await PersonalInfo.findOne({ where: { userId } });
    const documents = await Document.findOne({ where: { userId } });
    const selfie = await Selfie.findOne({ where: { userId } });

    // 4 steps (25% each)
    let progress = 0;
    if (req.user.isConfirmed) progress += 25; // optional if I track email confirmation
    if (personalInfo) progress += 25;
    if (documents) progress += 25;
    if (selfie) progress += 25;

    res.json({ progress });
  } catch (err) {
    console.error('💥 Error in review-progress:', err);
    res.status(500).json({ error: 'Failed to calculate progress' });
  }
});


module.exports = router;
