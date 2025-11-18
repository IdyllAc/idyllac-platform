// config/passport-linkedin.js
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    console.warn('⚠️ Skipping LinkedIn OAuth: missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET');
    return;
  }

  console.log('✅ Linkedin OAuth strategy loaded');

  passport.use(
    new LinkedInStrategy(
    {
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: `${process.env.NODE_URL}/auth/linkedin/callback`,
    scope: ['r_emailaddress', 'r_liteprofile']
  }, 
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.id}@linkedin.temp`;
      const avatar = profile.photos?.[0]?.value || null;

      const [user] = await SocialUser.findOrCreate({
        where: { email },
        defaults: {
          name: profile.displayName || profile.username,
          provider: 'linkedin',
          isConfirmed: true,
        },
      });

     return done(null, user);
    } catch (err) {
      console.error('❌ Linkedin OAuth error:', err);
      return done(err, null);
    }
  }));
};
