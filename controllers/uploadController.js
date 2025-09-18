// controllers/uploadController.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { Document, Selfie } = require('../models');

// 📄 Upload Documents
exports.uploadDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const docPaths = {
      passport_path: req.files.passport_path?.[0]?.path || null,
      id_card_path: req.files.id_card_path?.[0]?.path || null,
      license_path: req.files.license_path?.[0]?.path || null,
      userId,
    };

    const existing = await Document.findOne({ where: { userId } });
    if (existing) await existing.destroy();

    await Document.create(docPaths);

    res.json({ message: 'Documents uploaded successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Document upload failed.' });
  }
};

// 📷 Upload Selfie
exports.uploadSelfie = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDir = path.join(__dirname, '..', 'uploads', String(userId));
    const finalFile = 'selfie.jpg';
    const finalPath = path.join(userDir, finalFile);

    fs.mkdirSync(userDir, { recursive: true });

    // Resize + overwrite final file
    await sharp(req.file.path)
      .resize({ width: 600 })
      .toFile(finalPath);

    // Save to DB (relative filename)
    const existing = await Selfie.findOne({ where: { userId } });
    if (existing) {
      existing.selfie_path = finalFile;
      await existing.save();
    } else {
      await Selfie.create({ selfie_path: finalFile, userId });
    }

    res.json({ message: 'Selfie uploaded successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Selfie upload failed.' });
  }
};