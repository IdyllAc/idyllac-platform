// routes/subscription.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

router.post('/subscriber/email', subscriptionController.subscribeByEmail);
router.post('/submit', subscriptionController.submitMessage);

module.exports = router;
