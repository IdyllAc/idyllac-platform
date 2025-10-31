// routes/subscribe.js
const express = require('express');
const router = express.Router();
const subscribeController = require('../controllers/subscribeController');

// 📩 Email subscription
router.post('/email', subscribeController.subscribeEmail);


module.exports = router;
