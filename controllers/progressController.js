// controllers/progressController.js
const { PersonalInfo, Document, Selfie } = require('../models');

exports.reviewProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const personalInfo = await PersonalInfo.findOne({ where: { userId } });
    const documents = await Document.findOne({ where: { userId } });
    const selfie = await Selfie.findOne({ where: { userId } });

    let progress = 0;
    if (req.user.isConfirmed) progress += 25; // optional email confirmation
    if (personalInfo) progress += 25;
    if (documents) progress += 25;
    if (selfie) progress += 25;

    res.json({ progress });
  } catch (err) {
    console.error('💥 Error in reviewProgress:', err);
    res.status(500).json({ error: 'Failed to calculate progress' });
  }
};
