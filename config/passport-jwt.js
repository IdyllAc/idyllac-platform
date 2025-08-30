// config/passport-jwt.js
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { User } = require('../models');

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET,
};

module.exports = passport => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        console.log('🔍 JWT payload received:', jwt_payload);

        // In your tokens you probably use { userid: user.id } — confirm this
        const userId = jwt_payload.userid || jwt_payload.id;

        if (!userId) {
          console.warn('❌ JWT payload missing userid');
          return done(null, false);
        }

        const user = await User.findByPk(userId);

        if (!user) {
          console.warn('❌ No user found for id from JWT:', userId);
          return done(null, false);
        }

        if (!user.is_confirmed) {
          console.warn('❌ User not confirmed:', user.email);
          return done(null, false);
        }

        // If you want to support banning later, add column `is_banned`
        // if (user.is_banned) return done(null, false);

        console.log('✅ JWT auth success for:', user.email);
        return done(null, user);

      } catch (err) {
        console.error('🔥 Error in Passport JWT Strategy:', err);
        return done(err, false);
      }
    })
  );
};
