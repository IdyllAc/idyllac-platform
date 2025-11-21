// // config/passport-instagram.js
// const { Strategy: InstagramStrategy } = require('passport-instagram');
// const { SocialUser } = require('../models');

// module.exports = (passport) => {
//   if (!process.env.INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET) {
//     console.warn('⚠️ Skipping Instagram OAuth: missing INSTAGRAM_CLIENT_ID or INSTAGRAM_CLIENT_SECRET');
//     return;
//   }

//   console.log('✅ Instagram OAuth strategy loaded');

//   passport.use(
//     new InstagramStrategy(
//       {
//         clientID: process.env.INSTAGRAM_CLIENT_ID,
//         clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
//         callbackURL: `${process.env.BASE_URL}/auth/instagram/callback`,
//       },
//       async (accessToken, refreshToken, profile, done) => {
//         try {
//           // Instagram does not return email, create a placeholder
//           const email = `${profile.id}@instagram.temp`;
//           const avatar = profile.photos?.[0]?.value || null;

//           const [user] = await SocialUser.findOrCreate({
//             where: { provider_id: profile.id },
//             defaults: {
//               name: profile.displayName || profile.username,
//               email,
//               avatar_url: avatar,
//               provider: 'instagram',
//               isConfirmed: true,
//             },
//           });

//           return done(null, user);
//         } catch (err) {
//           console.error('❌ Instagram OAuth error:', err);
//           return done(err, null);
//         }
//       }
//     )
//   );
// };
