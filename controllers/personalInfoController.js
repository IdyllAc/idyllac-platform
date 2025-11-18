// controllers/personalInfoController.js
const { PersonalInfo } = require('../models');

exports.submitPersonalInfo = async (req, res) => {
  try {
    console.log("📥 Received personal info submission:", req.body);
    const userId = req.user?.id; // Comes from decoded JWT

    if (!userId) {
      console.warn("⚠️ Missing user ID in token.");
      return res.status(401).json({ error: "Unauthorized or missing token." });
    }

    // Extract form values from body
    const payload = req.body;

    // ⬇️⬇️⬇️ **🔵 INSERT FIX RIGHT HERE** ⬇️⬇️⬇️
    payload.first_name ??= req.user.first_name;
    payload.last_name ??= req.user.last_name;
    payload.date_of_birth ??= req.user.date_of_birth;

    // OR if you prefer the loop version:
    /*
    ["first_name", "last_name", "date_of_birth"].forEach(field => {
      if (payload[field] == null || payload[field] === "") {
        payload[field] = req.user[field];
      }
    });
    */
    // ⬆️⬆️⬆️ **🔵 END OF INSERTION** ⬆️⬆️⬆️

    // Extract from form
    const {
      gender,
      first_name,
      last_name,
      date_of_birth,
      phone,
      nationality,
      occupation
    } = req.body;

    // Remove old entry if it exists
    let existing = await PersonalInfo.findOne({ where: { userId } });
    if (existing) {
      console.log("♻️ Replacing existing personal info for user:", userId);
      await existing.destroy({
        gender,
        first_name,
        last_name,
        date_of_birth,
        phone,
        nationality,
        occupation
      });
    } else {

    // Save personal info in DB…
    await PersonalInfo.create({
      userId,
      gender: payload.gender,
      first_name: payload.first_name,
      last_name: payload.last_name,
      date_of_birth: payload.date_of_birth,
      phone: payload.phone,
      nationality: payload.nationality,
      occupation: payload.occupation,
    });
    }

    console.log("✅ Personal info saved successfully for user:", userId);

    // Determine response type
    const isAjax = req.xhr || req.headers.accept?.includes("application/json");

    if (isAjax) {
      // fetch() requests
      return res.json({ success: true, message: 'Personal info saved and submitted successfully!' });
    } else {
      // normal form submit
      return res.redirect("/protect/upload/document");
    }

  } catch (err) {
    console.error("❌ Error saving personal info:", err);

    const isAjax = req.xhr || req.headers.accept?.includes("application/json");

    if (isAjax) {
      return res.status(500).json({ error: "Failed to submit personal info." });
    } else {
      req.flash("error", "Failed to submit personal info.");
      return res.redirect("/personal");
    }
  }
};








// // controllers/personalInfoController.js
// const { PersonalInfo } = require('../models');


// // GET /personal
// // exports.getpersonal = (req, res) => res.render('personal');

// exports.submitPersonalInfo = async (req, res) => {
//   try {
//     console.log("📥 Received personal info submission:", req.body);
//     const userId = req.user?.id; // Comes from decoded JWT

//     if (!userId) {
//       console.warn("⚠️ Missing user ID in token.");
//       return res.status(401).json({ error: "Unauthorized or missing token." });
//     }

//     const { gender, first_name, last_name, date_of_birth, phone, nationality, occupation } = req.body;

//     // Remove old entry if it exists
//     const existing = await PersonalInfo.findOne({ where: { userId } });
//     if (existing) {
//       console.log("♻️ Replacing existing personal info for user:", userId);
//       await existing.destroy();
//     }

//      // Save personal info in DB…
//     await PersonalInfo.create({
//       userId,
//       gender,
//       first_name,
//       last_name,
//       date_of_birth,
//       phone,
//       nationality,
//       occupation,
//     });

//     console.log("✅ Personal info saved successfully for user:", userId);

//     // ✅ Determine response type
//     const isAjax = req.xhr || req.headers.accept?.includes("application/json");

//     if (isAjax) {
//       // For fetch() requests
//       // 👇 if JWT client, return JSON
//     res.json({ message: 'Personal info saved and submitted successfully!' });
//   } else {
//     // For normal form submissions
//     return res.redirect("/protect/upload/document");
//   }

// } catch (err) {
//   console.error("❌ Error saving personal info:", err);

//   const isAjax = req.xhr || req.headers.accept?.includes("application/json");

//   if (isAjax) {
//     return res.status(500).json({ error: "Failed to submit personal info." });
//   } else {
//     req.flash("error", "Failed to submit personal info.");
//     return res.redirect("/personal");
//   }
// }
// };
