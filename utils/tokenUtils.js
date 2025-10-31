const jwt = require('jsonwebtoken');
const { RefreshToken } = require('../models');

/**
 * Generate an access token (short-lived)
 * @param {Object} user - user object { id, email }
 * @returns {string} - signed JWT access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' } // short-lived access
  );
}

/**
 * Generate and store a refresh token (long-lived)
 * Always deletes old tokens for the user before inserting a new one
 * @param {Object} user - user object { id, email }
 * @returns {Promise<string>} - signed JWT refresh token
 */
async function generateRefreshToken(user) {
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '1d' } // ✅ long-lived refresh token 1 day, same as session
  );

  // 🔑 Delete old refresh tokens for this user (rotate)
  await RefreshToken.destroy({ where: { userId: user.id } });

  // Save new refresh token in DB
  await RefreshToken.create({
    token,
    userId: user.id,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 days
  });

  return token;
}

/**
 * Verify a refresh token and return decoded payload
 * @param {string} token
 * @returns {Object} - decoded JWT payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
}

/**
 * Revoke (delete) a refresh token from DB
 * @param {string} token
 * @returns {Promise<number>} - number of deleted rows
 */
async function revokeRefreshToken(token) {
  return await RefreshToken.destroy({ where: { token } });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
};
