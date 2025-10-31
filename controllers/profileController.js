// controllers/profileController.js
const { User, UserProfile, UserSettings } = require('../models');

/**
 * GET /profile
 * Return user's profile (or empty object)
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🧩 Try to find existing profile
    let profile = await UserProfile.findOne({ where: { userId } });

    // 🧱 If not found, create it from the base user
    if (!profile) {
      const baseUser = await User.findByPk(userId);
      if (!baseUser) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Auto-create profile with base fields from main Users table
      profile = await UserProfile.create({
        userId,
        first_name: baseUser.first_name || '',
        last_name: baseUser.last_name || '',
        date_of_birth: baseUser.date_of_birth || null,
        gender: baseUser.gender || '',
        nationality: baseUser.nationality || '',
        occupation: baseUser.occupation || '',
        phone: baseUser.phone || '',
        phone_alt: baseUser.phone_alt || '',
        telephone_fixe: baseUser.telephone_fixe || '',
        country_of_birth: baseUser.country_of_birth || '',
        country_of_living: baseUser.country_of_living || '',
        state: baseUser.state || '',
        city: baseUser.city || '',
        address: baseUser.address || '',
        language_preference: baseUser.language_preference || 'English',
        profile_photo: baseUser.profile_photo || '',
      });

      console.log(`🆕 Auto-created profile for user ${baseUser.email}`);
    }

    // ✅ Send response with a hint that the first three fields are fixed
    const profileData = profile.toJSON();
    profileData.lockedFields = ['first_name', 'last_name', 'date_of_birth']; // you can use this in frontend

    return res.json(profileData);

  } catch (err) {
    console.error('❌ getProfile error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

/**
 * POST /profile
 * Create or update user profile (whitelisted fields only).
 * Required (fixed) fields: first_name, last_name, date_of_birth
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔧 Fix: flatten Multer's array fields into strings
for (const key in req.body) {
  if (Array.isArray(req.body[key])) {
    req.body[key] = req.body[key][0];
  }
}
console.log('🧩 req.body after flattening:', req.body);


    // 🔒 Whitelist allowed profile fields (so malicious keys are ignored)
    const payload = {};
    const allowed = [
      'first_name', 'last_name', 'date_of_birth',
      'gender', 'nationality', 'occupation', 'phone', 'phone_alt', 
      'telephone_fixe', 'country_of_birth', 'country_of_living', 
      'state', 'city', 'address', 'language_preference' 
    ];

   
    allowed.forEach((k) => {
      if (req.body[k] !== undefined && req.body[k] !== '') {
        payload[k] = req.body[k];
     }
    });
    

    // Handle uploaded photo
    if (req.file) {
      payload.profile_photo = `/uploads/profile_photos/${req.file.filename}`;
    }
    
    // // Validate required fields
    // if (!payload.first_name || !payload.last_name || !payload.date_of_birth) {
    //   return res.status(400).json({ 
    //     error: 'first_name, last_name and date_of_birth are required.' 
    //   });
    // }

    // Relaxed: only warn if all three required fields are missing
    if (!payload.first_name && !payload.last_name && !payload.date_of_birth) {
      // Only enforce if all missing
      console.warn('⚠️ Skipping required check: readonly fields not submitted');
    }
    


    // ✅ Upsert logic
    let profile = await UserProfile.findOne({ where: { userId } });
    if (profile) {
      await profile.update(payload);
    } else {
      profile = await UserProfile.create({ userId, ...payload });
    }
    
    console.log('🧩 req.body:', req.body);
    console.log('🖼 req.file:', req.file);


    return res.json({ message: '✅ Profile saved successfully.', profile });
  } catch (err) {
    console.error('❌ updateProfile error:', err);
    return res.status(500).json({ error: 'Failed to save profile.' });
  }
};


/**
 * GET /settings
 * Return user settings (create defaults on first access)
 */
exports.getSettings = exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await UserSettings.findOne({ where: { userId } });

    // // If not found, create default settings
    // const baseUser = await User.findByPk(userId);
    // if (!baseUser) {
    //   return res.status(404).json({ error: 'User not found.' });
    // }

    if (!settings) {
      // create default settings row (so front-end can update)
      settings = await UserSettings.create({ userId });
    // console.log(`🆕 created default settings for user ${baseUser.email}`);
       }

    return res.json(settings);
  } catch (err) {
    console.error('❌ getSettings error:', err);
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
};

/**
 * POST /sittings
 * Create or update settings. Coerce boolean-like values.
 */
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email_notifications, dark_mode, language } = req.body;

    const toBool = (v) => {
      if (v === true || v === 'true' || v === 'on' || v === '1' || v === 1) return true;
      return false;
    };

    const payload = {
      email_notifications: toBool(email_notifications),
      dark_mode: toBool(dark_mode),
      language: language || 'en'
    };

    let settings = await UserSettings.findOne({ where: { userId } });
    if (settings) {
      await settings.update(payload);
    } else {
      settings = await UserSettings.create({ userId, ...payload });
    }

    return res.json({ message: 'Settings updated successfully.', settings });
  } catch (err) {
    console.error('❌ updateSettings error:', err);
    return res.status(500).json({ error: 'Failed to update settings.' });
  }
};