// /config/passport.js
const passport = require('passport');
const { configureLocalStrategy } = require('./passport-config');
const { configureSocialStrategies } = require('./passport-social');
const { User } = require('../models');

function initializePassport() {
  // Initialize local strategy
  configureLocalStrategy(passport);

  // Initialize all social strategies
  configureSocialStrategies(passport);

  // Serialize user (store only ID in session)
  passport.serializeUser((user, done) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔑 serializeUser -> user.id:', user.id);
    }
    done(null, user.id);
  });

  // Deserialize user: fetch from DB by ID
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'isConfirmed'], // 👈 safe fields only
      });

      if (!user) {
        console.warn('⚠️ User not found during deserializeUser:', id);
        return done(null, false);
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('📦 deserializeUser ->', user.email);
      }

      done(null, user || false);
    } catch (err) {
      console.error('🔥 Error in deserializeUser:', err);
      done(err);
    }
  });
}

module.exports = initializePassport;
