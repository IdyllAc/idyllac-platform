// config/passport-twitter.js
const TwitterStrategy = require('passport-twitter').Strategy;
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    console.warn('⚠️ Skipping Twitter OAuth: missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET');
    return;
  }

  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CLIENT_ID,
    consumerSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: '/auth/twitter/callback',
    includeEmail: true
  }, async (token, tokenSecret, profile, done) => {
    try {
      const [user] = await SocialUser.findOrCreate({
        where: { provider_id: profile.id },
        defaults: {
          provider: 'twitter',
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
