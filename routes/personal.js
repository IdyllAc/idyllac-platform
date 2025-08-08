// routes/personal.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const { PersonalInfo } = require('../models');
const authenticateToken = require('../middleware/jwtMiddleware'); // JWT protect

   // // -----------------------------
  // // Submit Personal Information
  // // -----------------------------
  router.post('/submit/personal_info', authenticateToken, async (req, res) => {
    try {
      const { gender, name, first_name, date_Of_Birth, phone } = req.body;
  
      const userId = req.user.id; // Comes from decoded JWT
  
      const existing = await PersonalInfo.findOne({ where: { userId } });
      if (existing) await existing.destroy();
  
     constinfo = await PersonalInfo.create({
        userId,
        first_name,
        last_name,
        date_Of_Birth,
        phone,
        gender,
      });
  
      res.status(201).json({ message: 'Personal info submitted and saved successfully' });
      // res.redirect('/upload/document');
    } catch (err) {
      console.error('Error saving personal info:', err);
      res.status(500).json({ message: 'Server error during submission' });
    }
  });

module.exports = router;
