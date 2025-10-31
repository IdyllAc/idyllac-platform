// middleware/jwtMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async function jwtMiddleware(req, res, next) {
  try {
    // 1️⃣ Try to read token from cookie (fallback to Authorization header if needed)
    const token = req.cookies?.accessToken || (req.headers['authorization']?.split(' ')[1]);

    if (!token) {
      return res.status(401).json({ message: 'Access token missing' });
    }

    // 2️⃣ Verify JWT
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3️⃣ Lookup user
    const user = await User.findByPk(payload.id, {
      attributes: ['id', 'name', 'email'],
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // 4️⃣ Attach user object to request
    req.user = user;
    next();
  } catch (err) {
    console.error('❌ JWT verification error:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
