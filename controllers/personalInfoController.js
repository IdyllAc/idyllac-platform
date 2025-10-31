// controllers/personalInfoController.js
const { PersonalInfo } = require('../models');


// GET /personal
// exports.getpersonal = (req, res) => res.render('personal');

exports.submitPersonalInfo = async (req, res) => {
  try {
    console.log("📥 Received personal info submission:", req.body);
    const userId = req.user?.id; // Comes from decoded JWT

    if (!userId) {
      console.warn("⚠️ Missing user ID in token.");
      return res.status(401).json({ error: "Unauthorized or missing token." });
    }

    const { gender, first_name, last_name, date_of_birth, phone, nationality, occupation } = req.body;

    // Remove old entry if it exists
    const existing = await PersonalInfo.findOne({ where: { userId } });
    if (existing) {
      console.log("♻️ Replacing existing personal info for user:", userId);
      await existing.destroy();
    }

     // Save personal info in DB…
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

    console.log("✅ Personal info saved successfully for user:", userId);
     // 👇 if JWT client, return JSON
    res.json({ message: 'Personal info saved and submitted successfully!' });
    
  } catch (err) {
    console.error("❌ Error saving personal info:", err);
    res.status(500).json({ error: "Failed to submit personal info." });
  }
};
