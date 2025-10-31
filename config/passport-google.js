// // config/passport-google.js

// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const { SocialUser } = require('../models');

// module.exports = (passport) => {
//   passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: '/auth/google/callback'
//   }, async (accessToken, refreshToken, profile, done) => {
//     try {
//       const [user] = await SocialUser.findOrCreate({
//         where: { provider_id: profile.id },
//         defaults: {
//           provider: 'google',
//           name: profile.displayName,
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
