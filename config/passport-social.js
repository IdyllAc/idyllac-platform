// config/passport-social.js
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const { SocialUser } = require('../models');
require('dotenv').config();

// ✅ FACEBOOK
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: '/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const [user] = await SocialUser.findOrCreate({
          where: { provider_id: profile.id },
          defaults: {
            provider: 'facebook',
            name: `${profile.name.givenName} ${profile.name.familyName}`,
            email: profile.emails?.[0]?.value || null,
            avatar_url: profile.photos?.[0]?.value || null,
          },
        });
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// ✅ GOOGLE
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const [user] = await SocialUser.findOrCreate({
          where: { provider_id: profile.id },
          defaults: {
            provider: 'google',
            name: profile.displayName,
            email: profile.emails?.[0]?.value || null,
            avatar_url: profile.photos?.[0]?.value || null,
          },
        });
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// ✅ GITHUB
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/auth/github/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
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
    }
  )
);

// // ✅ TWITTER
// passport.use(
//   new TwitterStrategy(
//     {
//       consumerKey: process.env.TWITTER_CONSUMER_KEY,
//       consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
//       callbackURL: '/auth/twitter/callback',
//     },
//     async (token, tokenSecret, profile, done) => {
//       try {
//         const [user] = await SocialUser.findOrCreate({
//           where: { provider_id: profile.id },
//           defaults: {
//             provider: 'twitter',
//             name: profile.displayName,
//             avatar_url: profile.photos?.[0]?.value || null,
//           },
//         });
//         done(null, user);
//       } catch (err) {
//         done(err, null);
//       }
//     }
//   )
// );

// // ✅ LINKEDIN
// passport.use(
//   new LinkedInStrategy(
//     {
//       clientID: process.env.LINKEDIN_CLIENT_ID,
//       clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
//       callbackURL: '/auth/linkedin/callback',
//       scope: ['r_emailaddress', 'r_liteprofile'],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const [user] = await SocialUser.findOrCreate({
//           where: { provider_id: profile.id },
//           defaults: {
//             provider: 'linkedin',
//             name: profile.displayName,
//             email: profile.emails?.[0]?.value || null,
//             avatar_url: profile.photos?.[0]?.value || null,
//           },
//         });
//         done(null, user);
//       } catch (err) {
//         done(err, null);
//       }
//     }
//   )
// );

// // ✅ INSTAGRAM
// passport.use(
//   new InstagramStrategy(
//     {
//       clientID: process.env.INSTAGRAM_CLIENT_ID,
//       clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
//       callbackURL: '/auth/instagram/callback',
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const [user] = await SocialUser.findOrCreate({
//           where: { provider_id: profile.id },
//           defaults: {
//             provider: 'instagram',
//             name: profile.displayName,
//             avatar_url: profile.photos?.[0]?.value || null,
//           },
//         });
//         done(null, user);
//       } catch (err) {
//         done(err, null);
//       }
//     }
//   )
// );

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await SocialUser.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
