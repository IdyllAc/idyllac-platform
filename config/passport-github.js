// config/passport-github.js
const GitHubStrategy = require('passport-github2').Strategy;
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.warn('⚠️ Skipping GitHub OAuth: missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
    return;
  }

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/auth/github/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const [user] = await SocialUser.findOrCreate({
        where: { provider_id: profile.id },
        defaults: {
          provider: 'github',
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
