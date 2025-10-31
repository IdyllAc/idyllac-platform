// /config/passport.js

const { configureLocalStrategy } = require('./passport-config');
const { User } = require('../models');

function initializePassport(passport) {
  // Attach LocalStrategy
  configureLocalStrategy(passport);

  // Serialize user (store only ID in session cookie)
  passport.serializeUser((user, done) => {
    console.log('🔑 serializeUser -> user.id:', user.id);
    done(null, user.id);
  });

  // Deserialize user (fetch from DB on each request)
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'isConfirmed'], // 👈 safe fields only
      });

      if (!user) {
        console.warn('⚠️ User not found during deserializeUser:', id);
        return done(null, false);
      }

      console.log('📦 deserializeUser -> req.user:', user.email);
      done(null, user);
    } catch (err) {
      console.error('🔥 Error in deserializeUser:', err);
      done(err);
    }
  });
}

module.exports = initializePassport;
