// validators/profileValidator.js
const { body } = require('express-validator');

exports.validateProfile = [
  body('first_name').isString().isLength({ min: 2 }).withMessage('First name is required'),
  body('last_name').isString().isLength({ min: 2 }).withMessage('Last name is required'),
  body('date_of_birth').isDate().withMessage('Date of birth must be a valid date'),

  body('gender').optional().isString(),
  body('nationality').optional().isString(),
  body('occupation').optional().isString(),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('phone_alt').optional().isMobilePhone().withMessage('Invalid mobile number'),
  body('telephone_fixe').optional().isString().withMessage('Invalid phone number'),
  body('country_of_birth').optional().isString(),
  body('country_of_living').optional().isString(),
  body('state').optional().isString(),
  body('city').optional().isString(),
  body('address').optional().isString(),
  body('language_preference').optional().isIn(['ar', 'fr', 'en']).withMessage('Invalid language'),
  body('profile_photo').optional().isString(),
  ];




