// controllers/uploadController.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { Document, Selfie } = require('../models');

// 📄 Upload Documents
exports.uploadDocuments = async (req, res) => {
  try {
    // after multer saved files into uploads/<userId>/
    const userId = req.user.id;
    const baseUrlPath = '/uploads/' + String(userId) + '/';

    const docPaths = {
      passport_path: req.files.passport_path?.[0]?.filename ? baseUrlPath + req.files.passport_path[0].filename : null,
      id_card_path:  req.files.id_card_path?.[0]?.filename  ? baseUrlPath + req.files.id_card_path[0].filename  : null,
      license_path:  req.files.license_path?.[0]?.filename  ? baseUrlPath + req.files.license_path[0].filename  : null,
      userId,
    };

    const existing = await Document.findOne({ where: { userId } });
    if (existing) await existing.destroy();

    await Document.create(docPaths);

    // 🔄 Check if user expects JSON or normal redirect (API vs session)
    if (req.headers.accept?.includes('application/json') || req.headers.authorization) {
      return res.json({ message: 'Documents uploaded successfully.' });
    } else {
      return res.redirect('/protect/upload/selfie');
    }

  } catch (err) {
    console.error('❌ uploadDocuments error:', err);
    res.status(500).json({ error: 'Document upload failed.' });
  }
};


// 📷 Upload Selfie (update if exists, else create)
exports.uploadSelfie = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ Validation: check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: '❌ No selfie file uploaded' });
    }

    const userDir = path.join(__dirname, '..', 'uploads', String(userId));
    fs.mkdirSync(userDir, { recursive: true });

    const filename = `selfie_${Date.now()}.jpg`;
    const selfiePathAbs = path.join(userDir, filename);

    await sharp(req.file.path).resize({ width: 600 }).toFile(selfiePathAbs);
    fs.unlinkSync(req.file.path);

    // store relativePath for DB and frontend:
    const selfieRel = `/uploads/${userId}/${filename}`;

    const existing = await Selfie.findOne({ where: { userId } });
    if (existing) {
      existing.selfie_path = selfieRel;
      await existing.save();
    } else {
      await Selfie.create({ selfie_path: selfieRel, userId });
    }

     return res.json({ message: '✅ Selfie uploaded successfully.', selfie_path: selfieRel });
   
  } catch (err) {
    console.error('❌ uploadSelfie error:', err);
    res.status(500).json({ error: 'Selfie upload failed.' });
  }
};









// // controllers/uploadController.js
// const path = require('path');
// const fs = require('fs');
// const sharp = require('sharp');
// const { Document, Selfie } = require('../models');

// // 📄 Upload Documents
// exports.uploadDocuments = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const docPaths = {
//       passport_path: req.files.passport_path?.[0]?.path || null,
//       id_card_path: req.files.id_card_path?.[0]?.path || null,
//       license_path: req.files.license_path?.[0]?.path || null,
//       userId,
//     };

//     const existing = await Document.findOne({ where: { userId } });
//     if (existing) await existing.destroy();

//     await Document.create(docPaths);

//     res.json({ message: 'Documents uploaded successfully.' });
//     // return res.redirect("/protect/upload/selfie");
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Document upload failed.' });
//   }
// };


// // 📷 Upload Selfie (update if exists, else create)
// exports.uploadSelfie = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // ✅ Validation: check if file was uploaded
//     if (!req.file) {
//       console.log("📸 File received by Multer:", req.file);
//       return res.status(400).json({ error: '❌ No selfie file uploaded' });
//     }
    
//     const userDir = path.join(__dirname, '..', 'uploads', String(userId));
//     // Make sure user directory exists
//     fs.mkdirSync(userDir, { recursive: true });

//     const selfiePath = path.join(userDir, 'selfie.jpg');

//     console.log("📂 Saving selfie to:", selfiePath);

//     // Compress + resize image using sharp
//     await sharp(req.file.path)
//       .resize({ width: 600 })
//       .toFile(selfiePath);

//       // Remove temp uploaded file
//     fs.unlinkSync(req.file.path);

//     // Check if selfie already exists for user
//     const existing = await Selfie.findOne({ where: { userId } });
//     if (existing) {
//       console.log("♻ Updating existing selfie");
//       // Update existing record
//       existing.selfie_path = selfiePath;
//       await existing.save();
//     } else {
//       console.log("🆕 Creating new selfie record");
//       // Create new record
//       await Selfie.create({ selfie_path: selfiePath, userId });
//     }

//     res.json({ message: '✅ Selfie uploaded successfully.' });
//   } catch (err) {
//     console.error('❌ Upload selfie error:', err);
//     res.status(500).json({ error: 'Selfie upload failed.' });
//   }
// };
