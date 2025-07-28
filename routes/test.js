const express = require('express');
const router = express.Router();
const sendConfirmationEmail = require('../utils/sendEmail');

router.get('/test-email', async (req, res) => {
  try {
    await sendConfirmationEmail('your@email.com', 'testtoken123');
    res.send('✅ Test email sent!');
  } catch (err) {
    console.error('❌ Email failed:', err);
    res.status(500).send('Email failed.');
  }
});

module.exports = router;
