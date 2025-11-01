// config/passport-google.js
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Skipping Google OAuth: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const [user] = await SocialUser.findOrCreate({
        where: { provider_id: profile.id },
        defaults: {
          provider: 'google',
          name: profile.displayName || null,
          email: profile.emails?.[0]?.value || null,
          avatar_url: profile.photos?.[0]?.value || null,
        },
      });
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));
};


