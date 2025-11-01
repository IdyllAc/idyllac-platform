// config/passport-instagram.js
const InstagramStrategy = require('passport-instagram').Strategy;
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET) {
    console.warn('⚠️ Skipping Instagram OAuth: missing INSTAGRAM_CLIENT_ID or INSTAGRAM_CLIENT_SECRET');
    return;
  }

  passport.use(new InstagramStrategy({
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: '/auth/instagram/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const [user] = await SocialUser.findOrCreate({
        where: { provider_id: profile.id },
        defaults: {
          provider: 'instagram',
          name: profile.displayName || profile.username,
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
