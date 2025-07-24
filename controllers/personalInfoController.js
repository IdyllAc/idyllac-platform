// controllers/personalInfoController.js
const { PersonalInfo } = require('../models');

exports.submitPersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, date_of_birth, phone, gender } = req.body;

    // Remove old entry if it exists
    const existing = await PersonalInfo.findOne({ where: { userId } });
    if (existing) await existing.destroy();

    await PersonalInfo.create({
      id,
      userId,
      first_name,
      last_name,
      date_of_birth,
      phone,
      gender,
      nationality,
      occupation,
    });

    res.json({ message: 'Personal info submitted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit personal info.' });
  }
};
