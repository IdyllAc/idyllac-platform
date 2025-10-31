// routes/message.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// 📨 Submit a message
// 💬 Submit message (optional form)
router.post('/submit', messageController.submitMessage);

// ✅ NEW: GET /message/all — retrieve all messages + subscriber emails
router.get('/all', messageController.getAllMessages);

module.exports = router;
