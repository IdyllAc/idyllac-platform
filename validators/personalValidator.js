// validators/personalValidator.js
const { body } = require('express-validator');

exports.personalValidator = [
  body('full_name').isString().notEmpty().withMessage('Full name is required'),
  body('age').isInt({ min: 0 }).withMessage('Age must be a positive number'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('nationality').optional().isString(),
  body('occupation').optional().isString(),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];



