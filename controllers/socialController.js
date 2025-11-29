// controllers/socialController.js
const axios = require('axios');
const { User } = require('../models');

exports.tiktokCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send("Missing TikTok authorization code");
    }

    // 1. Exchange code for access_token
    const tokenRes = await axios.post(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TIKTOK_REDIRECT_URI
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const accessToken = tokenRes.data.access_token;

    // 2. Get TikTok user info
    const userRes = await axios.post(
      "https://open.tiktokapis.com/v2/user/info/",
      {
        fields: ["open_id", "union_id", "avatar", "display_name"]
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const info = userRes.data.data;

    const tiktokId = info.open_id;
    const username = info.display_name;
    const avatar = info.avatar;

    // 3. Find or create user in database
    let user = await User.findOne({ where: { tiktok_id: tiktokId } });

    if (!user) {
      user = await User.create({
        tiktok_id: tiktokId,
        username,
        profile_photo: avatar,
        registration_method: "tiktok"
      });
    }

    // 4. Log user in: create tokens
    const jwt = require('jsonwebtoken');

    const accessTokenJWT = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshTokenJWT = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    // Redirect to your dashboard with tokens
    res.redirect(
      `/auth/social/success?access=${accessTokenJWT}&refresh=${refreshTokenJWT}`
    );

  } catch (err) {
    console.error("❌ TikTok OAuth Error:", err.response?.data || err);
    res.status(500).send("TikTok login failed");
  }
};
