// controllers/registrationController.js
const { UserProfile, PersonalInfo, Document, Selfie } = require('../models');

// ✅ Finalize registration
exports.completeRegistration = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT/session middleware

    // Check the user profile
    const profile = await UserProfile.findOne({ where: { userId } });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    // Optional: Ensure all required steps are complete
    const personalInfo = await PersonalInfo.findOne({ where: { userId } });
    const documents = await Document.findOne({ where: { userId } });
    const selfie = await Selfie.findOne({ where: { userId } });

    if (!personalInfo || !documents || !selfie) {
      return res.status(400).json({ 
        message: 'Please complete all steps before finalizing registration.' 
      });
    }

    // Update registration status
    profile.registration_status = 'completed';
    await profile.save();

    // Respond with success
    res.json({
      message: 'Registration completed successfully!',
      next: '/dashboard' // 👈 redirect target
    });
  } catch (err) {
    console.error('❌ Error completing registration:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Show Completed Page
exports.showCompletedPage = async (req, res) => {
  try {
    const userId = req.user.id;

    const personalInfo = await PersonalInfo.findOne({ where: { userId } });
    const documents = await Document.findOne({ where: { userId } });
    const selfie = await Selfie.findOne({ where: { userId } });

    res.render('completed', {
      user: req.user,
      personalInfo,
      documents: documents ? {
        passport: documents.passport_path,
        id_card: documents.id_card_path,
        license: documents.license_path
      } : {},
      selfiePath: selfie ? selfie.selfie_path : null
    });
  } catch (err) {
    console.error('💥 Error loading completed page:', err);
    res.status(500).render('error', { message: 'Failed to load completed page' });
  }
};
