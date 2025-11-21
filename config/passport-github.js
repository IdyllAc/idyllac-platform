// config/passport-github.js
const GitHubStrategy = require('passport-github2').Strategy;
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.warn('⚠️ Skipping GitHub OAuth: missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
    return;
  }

  console.log('✅ GitHub OAuth strategy loaded');

  passport.use(
    new GitHubStrategy(
    {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/github/callback`,
  }, 
  async (accessToken, refreshToken, profile, done) => {
    try {
       const email = profile.emails?.[0]?.value || `${profile.id}@github.temp`;
       const avatar = profile.photos?.[0]?.value || null; // add avatar_url as an optional column

      // const email = 
      // profile.emails && profile.emails.length 
      // ? profile.emails[0].value 
      // : `${profile.id}@github.temp`;
      
      const [user] = await SocialUser.findOrCreate({
        where: { email },
        defaults: {
          name: profile.displayName || profile.username,
          provider: 'github',
          isConfirmed: true,
          // email: profile.emails?.[0]?.value || null,
          // avatar_url: profile.photos?.[0]?.value || null,
        },
      });

     return done(null, user);
    } catch (err) {
      console.error('❌ GitHub OAuth error:', err);
      return done(err, null);
    }
  }));
};
