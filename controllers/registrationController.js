// controllers/registrationController.js
const { UserProfile } = require('../models');

// Finalize registration
exports.completeRegistration = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ From JWT/session middleware

    // Find the user's profile
    const profile = await UserProfile.findOne({ where: { userId } });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    // Update registration status
    profile.registration_status = 'completed';
    await profile.save();

    // Respond with success
    res.json({
      message: 'Registration completed successfully!',
      next: '/dashboard' // 👈 Could be a redirect target
    });
  } catch (err) {
    console.error('❌ Error completing registration:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
