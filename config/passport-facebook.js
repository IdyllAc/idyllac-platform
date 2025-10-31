// // config/passport-facebook.js

// const FacebookStrategy = require('passport-facebook').Strategy;
// const { SocialUser } = require('../models');

// module.exports = (passport) => {
//   passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_CLIENT_ID,
//     clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//     callbackURL: '/auth/facebook/callback',
//     profileFields: ['id', 'emails', 'name', 'photos']
//   }, async (accessToken, refreshToken, profile, done) => {
//     try {
//       const [user] = await SocialUser.findOrCreate({
//         where: { provider_id: profile.id },
//         defaults: {
//           provider: 'facebook',
//           name: `${profile.name.givenName} ${profile.name.familyName}`,
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
