// controllers/personalInfoController.js
const { PersonalInfo } = require('../models');


// GET /personal
// exports.getpersonal = (req, res) => res.render('personal');

exports.submitPersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id; // Comes from decoded JWT
    const { gender, first_name, last_name, date_of_birth, phone, nationality, occupation } = req.body;

    // Remove old entry if it exists
    const existing = await PersonalInfo.findOne({ where: { userId } });
    if (existing) await existing.destroy();

    await PersonalInfo.create({
      userId,
      gender,
      first_name,
      last_name,
      date_of_birth,
      phone,
      nationality,
      occupation,
    });

    res.json({ message: 'Personal info submitted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit personal info.' });
  }
};
