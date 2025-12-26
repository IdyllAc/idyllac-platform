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
const registrationController = require('../controllers/registrationController');
const progressController = require('../controllers/progressController');
const { personalValidator } = require('../validators/personalValidator');
const { documentValidator } = require('../validators/documentValidator');
const { selfieValidator } = require('../validators/selfieValidator');
// const profileController = require('../controllers/profileController');


// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.user || !req.user.id) {
      console.error("❌ Multer error: req.user.id missing", req.user);
      return cb(new Error("User not authenticated"));
    }
    const userId = req.user.id.toString(); // make sure it is a string!
    const userDir = path.join(__dirname, '..', 'uploads', userId);
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
   // create a sanitized timestamped filename
   const ext = path.extname(file.originalname) || '';
   const safeBase = file.fieldname.replace(/[^a-z0-9_-]/gi, '');
   const filename = `${safeBase}_${Date.now()}${ext}`;
   cb(null, filename); 
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
router.get('/completed', combinedAuth, noCache, registrationController.showCompletedPage);

// ✅ Final step: Complete Registration
router.post('/complete', combinedAuth, noCache, registrationController.completeRegistration);


// ✅ Review Progress (moved logic into controller)
router.get('/review-progress', combinedAuth, noCache, progressController.reviewProgress);


// ✅ Route for success page
router.get("/selfie/success", (req, res) => {
  res.render("success"); // looks for views/success.ejs
});

// // Dashboard page
 //    ... 
// });


module.exports = router;