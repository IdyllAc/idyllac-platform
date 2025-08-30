// middleware/jwtMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to protect routes
module.exports = async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']; // Get token from headers (Bearer <token>)

    // if (!authHeader || !authHeader.startsWith('Bearer')) {   // Check if the authorization header is present and starts with 'Bearer'
    //     return res.status(401).json({ message: 'Authorization header missing or malformed' });
    //   }
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer')) {   // Check if the authorization header is present and starts with 'Bearer'
        return res.status(401).json({ message: 'Authorization header missing or malformed' });
      }

      const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401). json({ message: 'Authorization header missing or malformed'});
    }
    try {
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = await User.findByPk(payload.id, { attributes: ['id', 'name', 'email'] });
        if (!req.user) return res.status(404).json({ message: 'User not found' });
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(403).json({ message: 'Invalid token or expired' });
    }
  };


