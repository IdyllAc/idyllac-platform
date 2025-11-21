// config/passport-twitter.js
const TwitterStrategy = require('passport-twitter-oauth2').Strategy;
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    console.warn('⚠️ Skipping Twitter OAuth: missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET');
    return;
  }

  console.log('✅ Twitter OAuth strategy loaded');

  passport.use(
    new TwitterStrategy(
      {
    clientID: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/twitter/callback`,
    scope: ['tweet.read', 'users.read', 'offline.access'],
  }, 
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = 
      profile.emails && profile.emails.length 
      ? profile.emails[0].value 
      : `${profile.id}@twitter.temp`;
      
      const [user] = await SocialUser.findOrCreate({
        where: { email },
        defaults: {
          name: profile.displayName || profile.username,
          provider: 'twitter',
          isConfirmed: true,
        },
      });

      return done(null, user);
    } catch (err) {
      console.error('❌ Twitter OAuth error:', err);
     return done(err, null);
    }
  }));
};




//   passport.use(new TwitterStrategy({
//     consumerKey: process.env.TWITTER_CLIENT_ID,
//     consumerSecret: process.env.TWITTER_CLIENT_SECRET,
//     callbackURL: '/auth/twitter/callback',
//     includeEmail: true
//   }, async (token, tokenSecret, profile, done) => {
//     try {
//       const [user] = await SocialUser.findOrCreate({
//         where: { provider_id: profile.id },
//         defaults: {
//           provider: 'twitter',
//           name: profile.displayName || profile.username,
//           email: profile.emails?.[0]?.value || null,
//           avatar_url: profile.photos?.[0]?.value || null,
//         },
//       });
//       done(null, user);
//     } catch (err) {
//       done(err, null);
//     }
//   }));
// };
