// validators/settingsValidator.js
const { body } = require('express-validator');

exports.validateSettings = [
  body('email_notifications')
  .isBoolean()
  .withMessage('Must be true/false'),

  body('dark_mode')
    .isBoolean()
    .withMessage('Must be true/false'),

  body('language')
    .isIn(['ar', 'fr', 'en'])
    .withMessage('Invalid language'),
];





