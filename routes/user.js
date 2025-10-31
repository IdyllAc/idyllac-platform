// routes/user.js
const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middleware/jwtMiddleware'); // ✅ Correct: import as a function


// ✅ Add your Sequelize models here:
const { User, PersonalInfo, Document, Selfie } = require('../models'); // Adjust if path is different

// GET /profile
router.get('/profile', jwtMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email'],
      include: [PersonalInfo, Document, Selfie] // ✅ assuming associations are defined
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Profile loaded successfully', user }); // ✅ corrected res.json()
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error loading profile.' });
  }
});

// GET /settings
router.get('/settings', jwtMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['name', 'email', 'isConfirmed']
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Settings loaded successfully', user }); // ✅ send user settings too
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Settings fetch failed.' });
  }
});


module.exports = router;
