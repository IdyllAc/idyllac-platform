// validators/personalValidator.js
const { body } = require('express-validator');

exports.personalValidator = [
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('first_name').isString().notEmpty().withMessage('First name is required'),
  body('last_name').isString().notEmpty().withMessage('Last name is required'),
  body('date_of_birth').isInt({ min: 0 }).withMessage('Date of birth must be a positive number'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('nationality').optional().isString(),
  body('occupation').optional().isString(),

];



