// validators/selfieValidator.js
const { body } = require('express-validator');

exports.selfieValidator = [
  body('selfie').notEmpty().withMessage('Selfie file is required'),
];


