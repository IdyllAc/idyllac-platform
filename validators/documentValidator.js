// documentValidator.js
const { body } = require('express-validator');

exports.documentValidator = [
  body('passport').optional().isString().withMessage('Passport must be a string'),
  body('id_card').optional().isString().withMessage('ID card must be a string'),
  body('driving_license').optional().isString().withMessage('Driving license must be a string'),
];


