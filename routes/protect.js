// routes/protect.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const jwtMiddleware = require('../middleware/jwtMiddleware');
const noCache = require('../middleware/noCache');

const combinedAuth = require('../middleware/combinedAuth');
const uploadController = require('../controllers/uploadController');
const personalInfoController = require('../controllers/personalInfoController');
const { completeRegistration, showCompletedPage } = require('../controllers/registrationController');
const progressController = require('../controllers/progressController');
const { personalValidator } = require('../validators/personalValidator');
const { documentValidator } = require('../validators/documentValidator');
const { selfieValidator } = require('../validators/selfieValidator');
const profileController = require('../controllers/profileController');


// Configure multer storage for file uploads
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
router.get('/personal_info', combinedAuth, noCache, (req, res) => {
  res.render('personal', { user: req.user });
});

// ✅ Submit Personal Info form
router.post(
  '/personal_info', 
  combinedAuth,        // ✅ replaces jwtMiddleware
  noCache, 
  personalValidator,   // <---- added
  personalInfoController.submitPersonalInfo);

// ✅ Show Upload Document form
router.get('/upload/document', combinedAuth, noCache, (req, res) => {
    res.render('document', { user: req.user });
  });


// ✅ Upload Documents
router.post(
  '/upload/document',
  combinedAuth,  // replaces jwtMiddleware
  noCache, 
  upload.fields([
    { name: 'passport_path', maxCount: 1 },
    { name: 'id_card_path', maxCount: 1 },
    { name: 'license_path', maxCount: 1 }
  ]),
  documentValidator,   // <---- added
  uploadController.uploadDocuments
);


// ✅ Show Upload Selfie form
router.get('/upload/selfie', combinedAuth, noCache, (req, res) => {
    res.render('selfie', { user: req.user });
  }
);


// ✅ Upload Selfie
router.post(
  '/upload/selfie', 
  combinedAuth,  // replaces jwtMiddleware
  noCache, 
  upload.single('selfie'),
  selfieValidator,   // <---- added
  uploadController.uploadSelfie
);


// ✅ Completed Page (from controller)
router.get('/completed', jwtMiddleware, showCompletedPage);

// ✅ Final step: Complete Registration
router.post('/complete', jwtMiddleware, completeRegistration);


// ✅ Review Progress (moved logic into controller)
router.get('/review-progress', jwtMiddleware, progressController.reviewProgress);


// ✅ Route for success page
router.get("/selfie/success", (req, res) => {
  res.render("success"); // looks for views/success.ejs
});

// Dashboard page
router.get("/dashboard", (req, res) => {
  res.render("dashboard", {   // views/dashboard.ejs
    user: req.user,
  progress: 0  // 👈 default value (or compute dynamically)
   }); 
});


module.exports = router;
