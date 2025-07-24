// controllers/profileController.js
const { UserProfile, UserSettings } = require('../models');

// -------------------------
// Get Profile Info
// -------------------------
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserProfile.findOne({ where: { userId } });
    res.json(profile || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile data.' });
  }
};

// -------------------------
// Update Profile Info
// -------------------------
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, date_of_birth, phone, gender, nationality, occupation } = req.body;

    const [profile, created] = await UserProfile.upsert({
      id,
      userId,
      first_name,
      last_name,
      date_of_birth,
      phone,
      gender,
      nationality,
      occupation,
    });

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// -------------------------
// Get Settings
// -------------------------
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await UserSettings.findOne({ where: { userId } });
    res.json(settings || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
};

// -------------------------
// Update Settings
// -------------------------
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email_notifications, dark_mode, language } = req.body;

    const [settings, created] = await UserSettings.upsert({
      id,
      userId,
      email_notifications,
      dark_mode,
      language
    });

    res.json({ message: 'Settings updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
};
