// middlewares/combinedAuth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async function combinedAuth(req, res, next) {

  // 1️⃣ First — check Passport session (EJS/session-based login)
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log("🧭 combinedAuth → Session user:", req.user?.email || req.user?.id);
      return next(); // ✅ user authenticated via session
    }

   
    // 2️⃣ Next — check JWT (API/fetch-based login)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.warn("⚠️ combinedAuth → No JWT or session found");
      return res.status(401).json({ error: 'Unauthorized: no valid token or session' });
    }

    // Verify token
    try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded?.id) throw new Error('Invalid token payload');
     
    // Attach user object (optional: check user exists in DB)
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'name', 'isConfirmed'] 
    });
    if (!user) throw new Error('User not found');

    req.user = user;
    console.log("🧭 combinedAuth → JWT user:", user.email);
    return next();

  } catch (err) {
    console.warn("⚠️ combinedAuth → Token error:", err.message);
    return res.status(401).json({ error: 'Authentication failed: ' + err.message });
  }
};