// config/passport-linkedin.js
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    console.warn('⚠️ Skipping LinkedIn OAuth: missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET');
    return;
  }

  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: '/auth/linkedin/callback',
    scope: ['r_emailaddress', 'r_liteprofile']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const [user] = await SocialUser.findOrCreate({
        where: { provider_id: profile.id },
        defaults: {
          provider: 'linkedin',
          name: profile.displayName,
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
