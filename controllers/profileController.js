// controllers/profileController.js
const { User, UserProfile, UserSettings, PersonalInfo } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Helper: normalize date to YYYY-MM-DD or return null for invalid
 */
function normalizeDate(input) {
  if (!input) return null;
  // Accept Date objects or ISO strings or other parseable strings
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Try to obtain identity fields (first_name, last_name, date_of_birth)
 * Preference order:
 *  1) req.user fields (if present and non-empty)
 *  2) PersonalInfo model (if exists)
 * Returns object { first_name, last_name, date_of_birth } possibly with nulls
 */
async function resolveIdentityFields(reqUserId, reqUser) {
  // Start with values from req.user if available
  let first_name = (reqUser && reqUser.first_name) ? String(reqUser.first_name).trim() : null;
  let last_name  = (reqUser && reqUser.last_name) ? String(reqUser.last_name).trim() : null;
  let date_of_birth = normalizeDate(reqUser && reqUser.date_of_birth);

  // If any missing, try PersonalInfo
  if (!first_name || !last_name || !date_of_birth) {
    try {
      const personal = await PersonalInfo.findOne({ where: { userId: reqUserId } });
      if (personal) {
        first_name    = first_name || (personal.first_name ? String(personal.first_name).trim() : null);
        last_name     = last_name  || (personal.last_name  ? String(personal.last_name).trim()  : null);
        date_of_birth = date_of_birth || normalizeDate(personal.date_of_birth);
      }
    } catch (err) {
      console.warn('Could not load PersonalInfo for identity resolution:', err.message || err);
    }
  }

  return { first_name: first_name || null, last_name: last_name || null, date_of_birth: date_of_birth || null };
}

/**
 * GET /profile/data
 * Return user's profile (or create it from available identity info)
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    let profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      // Resolve identity fields from req.user or PersonalInfo
      const identity = await resolveIdentityFields(userId, req.user);

      // If identity fields still missing -> ask the client to complete Personal Info first
      if (!identity.first_name || !identity.last_name || !identity.date_of_birth) {
        return res.status(400).json({
          error: 'Account missing required identity info. Please complete personal information first (first name, last name, date of birth).'
        });
      }

      // Create profile using identity + defaults
      profile = await UserProfile.create({
        userId,
        first_name: identity.first_name,
        last_name: identity.last_name,
        date_of_birth: identity.date_of_birth,
        gender: req.user.gender || '',
        nationality: req.user.nationality || '',
        occupation: req.user.occupation || '',
        phone: req.user.phone || '',
        phone_alt: req.user.phone_alt || '',
        telephone_fixe: req.user.telephone_fixe || '',
        country_of_birth: req.user.country_of_birth || '',
        country_of_living: req.user.country_of_living || '',
        state: req.user.state || '',
        city: req.user.city || '',
        address: req.user.address || '',
        language_preference: req.user.language_preference || 'English',
        profile_photo: req.user.profile_photo || '',
      });

      console.log(`🆕 Auto-created profile for user ${req.user.email || userId}`);
    }

    const profileData = profile.toJSON();
    profileData.lockedFields = ['first_name', 'last_name', 'date_of_birth'];

    return res.json(profileData);
  } catch (err) {
    console.error('❌ getProfile error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};


/**
 * POST /profile
 * Update or create user profile (whitelisted editable fields)
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Flatten arrays (Multer sometimes sends arrays)
    for (const key in req.body) {
      if (Array.isArray(req.body[key])) req.body[key] = req.body[key][0];
    }

    // Whitelist editable fields (no readonlys here)
    const payload = {};
    const allowed = [
      'gender', 'nationality', 'occupation',
      'phone', 'phone_alt', 'telephone_fixe',
      'country_of_birth', 'country_of_living',
      'state', 'city', 'address',
      'language_preference'
    ];

    allowed.forEach(k => {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    });

    // Photo handling (multer)
    if (req.file) payload.profile_photo = `/uploads/profile_photos/${req.file.filename}`;

    // Resolve identity fields server-side (never trust client)
    const identity = await resolveIdentityFields(userId, req.user);

    // If identity still missing, return 400 — user must complete personal info first
    if (!identity.first_name || !identity.last_name || !identity.date_of_birth) {
      return res.status(400).json({
        error: 'Cannot update profile because account is missing identity info (first_name, last_name, date_of_birth). Please complete Personal Info first.'
      });
    }

    // Attach readonly/required fields from resolved identity
    payload.first_name = identity.first_name;
    payload.last_name  = identity.last_name;
    payload.date_of_birth = identity.date_of_birth;

    // UPSERT: update if profile exists, otherwise create
    let profile = await UserProfile.findOne({ where: { userId } });

    if (profile) {
      await profile.update(payload);
    } else {
      profile = await UserProfile.create({ userId, ...payload });
    }
    return res.json({ message: '✅ Profile updated successfully.', profile });

  } catch (err) {
    console.error('❌ updateProfile error:', err);
    // Send Sequelize validation message to help debugging, but not stack
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: err.errors.map(e => e.message).join('; ') });
    }
    return res.status(500).json({ error: 'Failed to save profile.' });
  }
};


/**
 * GET /settings
 */
exports.getSettings = async (req, res) => {
  try {
    // `req.user` must exist (combinedAuth ensures it for protected routes)
    const userId = req.user.id;

    // Get existing settings or default values (but we won't create here)
    const settings = await UserSettings.findOne({ where: { userId } });

    // Render EJS page; front-end will fetch JSON to populate fields
    return res.render('settings', { user: req.user, settings: settings ? settings.get({ plain: true }) : null });
  } catch (err) {
    console.error('❌ renderSettingsPage error:', err);
    req.flash?.('error', 'Failed to open settings');
    return res.status(500).render('error', { message: 'Failed to open settings' });
  }
};



// exports.getSettings = async (req, res) => {
//   // Render EJS
//   try {
//     // fetch or create default
//     let settings = await UserSettings.findOne({ where: { userId: req.user.id }});
//     if (!settings) {
//       settings = await UserSettings.create({ userId: req.user.id });
//     }
//     // If client expects JSON (AJAX), return JSON
//     if (req.headers.accept?.includes('application/json') || req.xhr) {
//       return res.json(settings);
//     }
//     // else render EJS
//     return res.render('settings', { user: req.user, settings: settings.toJSON() });
//   } catch (err) {
//     console.error('❌ getSettingsPage error:', err);
//     if (req.headers.accept?.includes('application/json')) return res.status(500).json({ error: 'Failed to fetch settings' });
//     req.flash('error', 'Failed to load settings');
//     return res.redirect('/dashboard');
//   }
// };
// // exports.getSettings = async (req, res) => {
// //   try {
// //     const userId = req.user.id;

// //     let settings = await UserSettings.findOne({ where: { userId } });

// //     if (!settings) settings = await UserSettings.create({ userId });

// //     return res.json(settings);
// //   } catch (err) {
// //     console.error('❌ getSettings error:', err);
// //     return res.status(500).json({ error: 'Failed to fetch settings.' });
// //   }
// // };

exports.getSettingsData = async (req, res) => {
  try {
    const userId = req.user.id;
    let settings = await UserSettings.findOne({ where: { userId } });

    // If not found, return sane defaults (don't create DB row here unless you want auto-create)
    if (!settings) {
      const defaults = {
        email_notifications: true,
        sms_notifications: false,
        marketing_emails: false,
        app_notifications: true,
        dark_mode: false,
        language: 'en',
        timezone: 'UTC',
        two_factor_enabled: false,
        auto_logout_minutes: 30,
        profile_visibility: 'private',
        show_email: false,
        show_phone: false,
        data_collection_opt_in: false,
        allow_tagging: true,
        auto_play_media: false,
        save_activity_history: true,
        content_language: 'en'
      };
      return res.json(defaults);
    }

    return res.json(settings);
  } catch (err) {
    console.error('❌ getSettingsData error:', err);
    return res.status(500).json({ error: 'Failed to load settings' });
  }
};
// exports.getSettingsJson = async (req, res) => {
//   try {
//     let settings = await UserSettings.findOne({ where: { userId: req.user.id }});
//     if (!settings) settings = await UserSettings.create({ userId: req.user.id });
//     return res.json(settings);
//   } catch (err) {
//     console.error('❌ getSettingsJson error:', err);
//     return res.status(500).json({ error: 'Failed to fetch settings' });
//   }
// };


// /**
//  * POST /settings
//  */
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Accept both JSON bodies and form bodies
    const incoming = { ...(req.body || {}) };

    // Sanitize / coerce values
    const toBool = (v) => {
      if (v === true || v === 'true' || v === '1' || v === 1 || v === 'on') return true;
      return false;
    };

    const payload = {
      email_notifications: toBool(incoming.email_notifications),
      sms_notifications: toBool(incoming.sms_notifications),
      marketing_emails: toBool(incoming.marketing_emails),
      app_notifications: toBool(incoming.app_notifications),

      dark_mode: toBool(incoming.dark_mode),
      language: incoming.language || 'en',
      timezone: incoming.timezone || 'UTC',

      two_factor_enabled: toBool(incoming.two_factor_enabled),
      auto_logout_minutes: Number(incoming.auto_logout_minutes) || 30,

      profile_visibility: ['public', 'private', 'friends'].includes(incoming.profile_visibility)
        ? incoming.profile_visibility
        : 'private',

      show_email: toBool(incoming.show_email),
      show_phone: toBool(incoming.show_phone),
      data_collection_opt_in: toBool(incoming.data_collection_opt_in),
      allow_tagging: toBool(incoming.allow_tagging),

      auto_play_media: toBool(incoming.auto_play_media),
      save_activity_history: toBool(incoming.save_activity_history),
      content_language: incoming.content_language || (incoming.language || 'en'),
    };

    // Upsert
    let settings = await UserSettings.findOne({ where: { userId } });
    if (settings) {
      await settings.update(payload);
    } else {
      settings = await UserSettings.create({ userId, ...payload });
    }

    return res.json({ message: '✅ ✅ Settings saved', settings });
  } catch (err) {
    console.error('❌ updateSettings error:', err);
    return res.status(500).json({ error: 'Failed to save settings' });
  }
};
// exports.updateSettings = async (req, res) => {
//   try {
//     // whitelist only expected fields
//     const allowed = [
//       'email_notifications','sms_notifications','marketing_notifications','security_alerts',
//       'two_factor_enabled','two_factor_method',
//       'language','timezone','currency','date_format','time_format_24h',
//       'dark_mode','text_size','color_theme',
//       'preferred_contact_method','beta_features_enabled','api_access_enabled'
//     ];

//     const payload = {};
//     for (const k of allowed) {
//       if (req.body[k] !== undefined) {
//         // coerce booleans for common string values
//         if (['email_notifications','sms_notifications','marketing_notifications','security_alerts',
//              'two_factor_enabled','time_format_24h','dark_mode','beta_features_enabled','api_access_enabled'].includes(k)) {
//           payload[k] = (req.body[k] === true || req.body[k] === 'true' || req.body[k] === '1' || req.body[k] === 1);
//         } else {
//           payload[k] = req.body[k];
//         }
//       }
//     }

//     let settings = await UserSettings.findOne({ where: { userId: req.user.id }});
//     if (settings) {
//       await settings.update(payload);
//     } else {
//       payload.userId = req.user.id;
//       settings = await UserSettings.create(payload);
//     }

//     // return json for fetch
//     if (req.headers.accept?.includes('application/json') || req.xhr) {
//       return res.json({ message: 'Settings updated', settings });
//     }
//     req.flash('success', 'Settings updated');
//     return res.redirect('/protect/settings');
//   } catch (err) {
//     console.error('❌ updateSettings error:', err);
//     if (req.headers.accept?.includes('application/json') || req.xhr) return res.status(500).json({ error: 'Failed to update settings' });
//     req.flash('error', 'Failed to save settings');
//     return res.redirect('/protect/settings');
//   }
// };


// // exports.updateSettings = async (req, res) => {
// //   try {
// //     const userId = req.user.id;

// // // Flatten arrays (Multer sometimes sends arrays)
// //     for (const key in req.body) {
// //       if (Array.isArray(req.body[key])) req.body[key] = req.body[key][0];
// //     }

// //     const { email_notifications, dark_mode, language } = req.body;

// //     const toBool = v => (v === true || v === 'true' || v === 'on' || v === '1' || v === 1);

// //     const payload = {
// //       email_notifications: toBool(email_notifications),
// //       dark_mode: toBool(dark_mode),
// //       language: language || 'en'
// //     };

// //     let settings = await UserSettings.findOne({ where: { userId } });

// //     if (settings) {
// //       await settings.update(payload);
// //     } else {
// //       settings = await UserSettings.create({ userId, ...payload });
// //     }

// //     return res.json({ message: '✅ Settings updated successfully.', settings });
    
// //   } catch (err) {
// //     console.error('❌ updateSettings error:', err);
// //      // Send Sequelize validation message to help debugging, but not stack
// //      if (err.name === 'SequelizeValidationError') {
// //       return res.status(400).json({ error: err.errors.map(e => e.message).join('; ') });
// //     }
// //     return res.status(500).json({ error: 'Failed to update settings.' });
// //   }
// // };










// // controllers/profileController.js
// const { User, UserProfile, UserSettings } = require('../models');

// /**
//  * GET /profile
//  * Return user's profile (or create one)
//  */
// exports.getProfile = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     let profile = await UserProfile.findOne({ where: { userId } });

//     if (!profile) {
//       const baseUser = await User.findByPk(userId);
//       if (!baseUser) {
//         return res.status(404).json({ error: 'User not found.' });
//       }

//       profile = await UserProfile.create({
//         userId,
//         first_name: baseUser.first_name || '',
//         last_name: baseUser.last_name || '',
//         date_of_birth: baseUser.date_of_birth || '',
//         gender: baseUser.gender || '',
//         nationality: baseUser.nationality || '',
//         occupation: baseUser.occupation || '',
//         phone: baseUser.phone || '',
//         phone_alt: baseUser.phone_alt || '',
//         telephone_fixe: baseUser.telephone_fixe || '',
//         country_of_birth: baseUser.country_of_birth || '',
//         country_of_living: baseUser.country_of_living || '',
//         state: baseUser.state || '',
//         city: baseUser.city || '',
//         address: baseUser.address || '',
//         language_preference: baseUser.language_preference || 'English',
//         profile_photo: baseUser.profile_photo || '',
//       });

//       console.log(`🆕 Auto-created profile for user ${baseUser.email}`);
//     }

//     const profileData = profile.toJSON();
//     profileData.lockedFields = ['first_name', 'last_name', 'date_of_birth'];

//     return res.json(profileData);

//   } catch (err) {
//     console.error('❌ getProfile error:', err);
//     return res.status(500).json({ error: 'Failed to fetch profile.' });
//   }
// };


// /**
//  * POST /profile
//  * Update user profile
//  */
// // controllers/profileController.js

// exports.updateProfile = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // ---------------------------------------
//     // 🔄 Fix Multer array fields
//     // ---------------------------------------
//     for (const key in req.body) {
//       if (Array.isArray(req.body[key])) {
//         req.body[key] = req.body[key][0];
//       }
//     }

//     // ---------------------------------------
//     // 🔒 Whitelist allowed fields
//     // ---------------------------------------
//     const payload = {};
//     const allowed = [
//       'gender', 'nationality', 'occupation',
//       'phone', 'phone_alt', 'telephone_fixe',
//       'country_of_birth', 'country_of_living',
//       'state', 'city', 'address',
//       'language_preference'
//     ];

//     allowed.forEach((k) => {
//       if (req.body[k] !== undefined) {
//         payload[k] = req.body[k];
//       }
//     });

//     // ---------------------------------------
//     // 🖼 Profile photo
//     // ---------------------------------------
//     if (req.file) {
//       payload.profile_photo = `/uploads/profile_photos/${req.file.filename}`;
//     }

//     // ---------------------------------------
//     // 🔵 FORCE readonly fields from User table
//     // (These MUST be correct — never trust the client)
//     // ---------------------------------------
//     payload.first_name = req.user.first_name;
//     payload.last_name = req.user.last_name;

//     // Fix invalid or empty date
//     if (
//       req.user.date_of_birth === "" ||
//       req.user.date_of_birth === "Invalid date" ||
//       !req.user.date_of_birth
//     ) {
//       console.warn("⚠️ Missing or invalid date_of_birth on user record");
//     }
//     payload.date_of_birth = req.user.date_of_birth;

//     // ---------------------------------------
//     // 🔄 UPSERT LOGIC
//     // ---------------------------------------
//     let profile = await UserProfile.findOne({ where: { userId } });

//     if (profile) {
//       // UPDATE
//       await profile.update(payload);
//       return res.json({
//         success: true,
//         message: "Profile updated",
//         profile
//       });
//     }

//     // CREATE (requires readonly fields)
//     payload.userId = userId;
//     profile = await UserProfile.create(payload);

//     return res.json({
//       success: true,
//       message: "Profile created",
//       profile
//     });

//   } catch (err) {
//     console.error("❌ updateProfile error:", err);
//     return res.status(500).json({
//       error: err.message || "Failed to save profile"
//     });
//   }
// };



// /**
//  * GET /settings
//  */
// exports.getSettings = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     let settings = await UserSettings.findOne({ where: { userId } });

//     if (!settings) {
//       settings = await UserSettings.create({ userId });
//     }

//     return res.json(settings);

//   } catch (err) {
//     console.error('❌ getSettings error:', err);
//     return res.status(500).json({ error: 'Failed to fetch settings.' });
//   }
// };


// /**
//  * POST /settings
//  */
// exports.updateSettings = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { email_notifications, dark_mode, language } = req.body;

//     const toBool = (v) => {
//       return (v === true || v === 'true' || v === 'on' || v === '1' || v === 1);
//     };

//     const payload = {
//       email_notifications: toBool(email_notifications),
//       dark_mode: toBool(dark_mode),
//       language: language || 'en'
//     };

//     let settings = await UserSettings.findOne({ where: { userId } });

//     if (settings) {
//       await settings.update(payload);
//     } else {
//       settings = await UserSettings.create({ userId, ...payload });
//     }

//     return res.json({ message: 'Settings updated successfully.', settings });

//   } catch (err) {
//     console.error('❌ updateSettings error:', err);
//     return res.status(500).json({ error: 'Failed to update settings.' });
//   }
// };










// // controllers/profileController.js
// const { User, UserProfile, UserSettings } = require('../models');

// /**
//  * GET /profile
//  * Return user's profile (or empty object)
//  */
// exports.getProfile = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // 🧩 Try to find existing profile
//     let profile = await UserProfile.findOne({ where: { userId } });

//     // 🧱 If not found, create it from the base user
//     if (!profile) {
//       const baseUser = await User.findByPk(userId);
//       if (!baseUser) {
//         return res.status(404).json({ error: 'User not found.' });
//       }

//       // Auto-create profile with base fields from main Users table
//       profile = await UserProfile.create({
//         userId,
//         first_name: baseUser.first_name || '', // FIXED
//         last_name: baseUser.last_name || '', // FIXED
//         date_of_birth: baseUser.date_of_birth || '', // FIXED
//         gender: baseUser.gender || '',
//         nationality: baseUser.nationality || '',
//         occupation: baseUser.occupation || '',
//         phone: baseUser.phone || '',
//         phone_alt: baseUser.phone_alt || '',
//         telephone_fixe: baseUser.telephone_fixe || '',
//         country_of_birth: baseUser.country_of_birth || '',
//         country_of_living: baseUser.country_of_living || '',
//         state: baseUser.state || '',
//         city: baseUser.city || '',
//         address: baseUser.address || '',
//         language_preference: baseUser.language_preference || 'English',
//         profile_photo: baseUser.profile_photo || '',
//       });

//       console.log(`🆕 Auto-created profile for user ${baseUser.email}`);
//     }

//     // ✅ Send response with a hint that the first three fields are fixed
//     const profileData = profile.toJSON();
//     profileData.lockedFields = ['first_name', 'last_name', 'date_of_birth']; // you can use this in frontend

//     return res.json(profileData);

//   } catch (err) {
//     console.error('❌ getProfile error:', err);
//     return res.status(500).json({ error: 'Failed to fetch profile.' });
//   }
// };


// /**
//  * POST /profile
//  * Create or update user profile (whitelisted fields only).
//  * Required (fixed) fields: first_name, last_name, date_of_birth
//  */
// exports.updateProfile = async (req, res) => {
//   try {
//     const userId = req.user.id;


//     // 🔧 Fix: flatten Multer's array fields into strings
//     or (const key in req.body) {
//     if (Array.isArray(req.body[key])) {
//     req.body[key] = req.body[key][0];
//   }
// }
// console.log('🧩 req.body after flattening:', req.body);


//     // 🔒 Whitelist allowed profile fields (so malicious keys are ignored)
//     const payload = {};
//     const allowed = [
//       'first_name', 'last_name', 'date_of_birth',
//       'gender', 'nationality', 'occupation', 'phone', 'phone_alt', 
//       'telephone_fixe', 'country_of_birth', 'country_of_living', 
//       'state', 'city', 'address', 'language_preference' 
//     ];

   
//     allowed.forEach((k) => {
//       if (req.body[k] !== undefined ) {
//         payload[k] = req.body[k];
//      }
//     });
    

//     // Handle uploaded photo
//     if (req.file) {
//       payload.profile_photo = `/uploads/profile_photos/${req.file.filename}`;
//     }

//     // Relaxed: only warn if all three required fields are missing
//     if (!payload.first_name && !payload.last_name && !payload.date_of_birth) {
//       // Only enforce if all missing
//       console.warn('⚠️ Skipping required check: readonly fields not submitted');
//     }
    


//     // ✅ Upsert logic
//     let profile = await UserProfile.findOne({ where: { userId } });

//     if (profile) {
//       await profile.update(payload);
//     } else {
//       profile = await UserProfile.create({ userId, ...payload });
//     }
    
//     console.log('🧩 req.body:', req.body);
//     console.log('🖼 req.file:', req.file);


//     return res.json({ message: '✅ Profile saved successfully.', profile });
//   } catch (err) {
//     console.error('❌ updateProfile error:', err);
//     return res.status(500).json({ error: 'Failed to save profile.' });
//   }
// };


// /**
//  * GET /settings
//  * Return user settings (create defaults on first access)
//  */
// exports.getSettings = exports.getSettings = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     let settings = await UserSettings.findOne({ where: { userId } });

//     // // If not found, create default settings
//     // const baseUser = await User.findByPk(userId);
//     // if (!baseUser) {
//     //   return res.status(404).json({ error: 'User not found.' });
//     // }

//     if (!settings) {
//       // create default settings row (so front-end can update)
//       settings = await UserSettings.create({ userId });
//     // console.log(`🆕 created default settings for user ${baseUser.email}`);
//        }

//     return res.json(settings);
//   } catch (err) {
//     console.error('❌ getSettings error:', err);
//     return res.status(500).json({ error: 'Failed to fetch settings.' });
//   }
// };

// /**
//  * POST /sittings
//  * Create or update settings. Coerce boolean-like values.
//  */
// exports.updateSettings = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { email_notifications, dark_mode, language } = req.body;

//     const toBool = (v) => {
//       if (v === true || v === 'true' || v === 'on' || v === '1' || v === 1) return true;
//       return false;
//     };

//     const payload = {
//       email_notifications: toBool(email_notifications),
//       dark_mode: toBool(dark_mode),
//       language: language || 'en'
//     };

//     let settings = await UserSettings.findOne({ where: { userId } });
//     if (settings) {
//       await settings.update(payload);
//     } else {
//       settings = await UserSettings.create({ userId, ...payload });
//     }

//     return res.json({ message: 'Settings updated successfully.', settings });
//   } catch (err) {
//     console.error('❌ updateSettings error:', err);
//     return res.status(500).json({ error: 'Failed to update settings.' });
//   }
// };