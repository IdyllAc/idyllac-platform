const TikTokStrategy = require('passport-tiktok-auth').Strategy;
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.TIKTOK_CLIENT_ID || !process.env.TIKTOK_CLIENT_SECRET) {
    console.warn('⚠️ Skipping TikTok OAuth: missing TIKTOK_CLIENT_ID or TIKTOK_CLIENT_SECRET');
    return;
  }

  passport.use(new TikTokStrategy({
    clientID: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    callbackURL: `${process.env.NODE_URL}/auth/tiktok/callback`,
    scope: ['user.info.basic'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const [user] = await SocialUser.findOrCreate({
        where: { provider_id: profile.id },
        defaults: {
          provider: 'tiktok',
          name: profile.displayName || null,
          email: profile.emails?.[0]?.value || null,
          avatar_url: profile.photos?.[0]?.value || null,
          isConfirmed: true,
        },
      });
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
};
