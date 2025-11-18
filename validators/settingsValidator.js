// validators/settingsValidator.js
const { body } = require('express-validator');

exports.validateSettings = [

  // -----------------------------
  // 🔵 NOTIFICATION SETTINGS
  // -----------------------------
  body('email_notifications')
    .optional()
    .isBoolean().withMessage('email_notifications must be true/false'),

  body('sms_notifications')
    .optional()
    .isBoolean().withMessage('sms_notifications must be true/false'),

  body('marketing_emails')
    .optional()
    .isBoolean().withMessage('marketing_emails must be true/false'),

  body('app_notifications')
    .optional()
    .isBoolean().withMessage('app_notifications must be true/false'),

  // -----------------------------
  // 🔵 ACCOUNT / SECURITY
  // -----------------------------
  body('two_factor_enabled')
    .optional()
    .isBoolean().withMessage('two_factor_enabled must be true/false'),

  body('auto_logout_minutes')
    .optional()
    .isInt({ min: 5, max: 240 })
    .withMessage('auto_logout_minutes must be between 5 and 240'),

  // -----------------------------
  // 🔵 PRIVACY
  // -----------------------------
  body('profile_visibility')
    .optional()
    .isIn(['public', 'friends', 'private'])
    .withMessage('Invalid profile visibility'),

  body('show_email')
    .optional()
    .isBoolean().withMessage('show_email must be true/false'),

  body('show_phone')
    .optional()
    .isBoolean().withMessage('show_phone must be true/false'),

  body('data_collection_opt_in')
    .optional()
    .isBoolean().withMessage('data_collection_opt_in must be true/false'),

  body('allow_tagging')
    .optional()
    .isBoolean().withMessage('allow_tagging must be true/false'),

  // -----------------------------
  // 🔵 APPEARANCE / APP SETTINGS
  // -----------------------------
  body('dark_mode')
    .optional()
    .isBoolean().withMessage('dark_mode must be true/false'),

  body('auto_play_media')
    .optional()
    .isBoolean().withMessage('auto_play_media must be true/false'),

  body('save_activity_history')
    .optional()
    .isBoolean().withMessage('save_activity_history must be true/false'),

  // -----------------------------
  // 🔵 LANGUAGE / REGION
  // -----------------------------
  body('language')
    .optional()
    .isIn(['en', 'fr', 'ar'])
    .withMessage('Invalid language'),

  body('content_language')
    .optional()
    .isIn(['en', 'fr', 'ar'])
    .withMessage('Invalid content language'),

  body('timezone')
    .optional()
    .isString().withMessage('Invalid timezone format'),

];









// // validators/settingsValidator.js
// const { body } = require('express-validator');

// exports.validateSettings = [
//   body('email_notifications')
//   .isBoolean()
//   .withMessage('Must be true/false'),

//   body('dark_mode')
//     .isBoolean()
//     .withMessage('Must be true/false'),

//   body('language')
//     .isIn(['ar', 'fr', 'en'])
//     .withMessage('Invalid language'),
// ];





