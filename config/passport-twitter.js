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







// // config/passport-twitter.js

// const TwitterStrategy = require("passport-twitter-oauth2").Strategy;
// const { User } = require("../models");

// module.exports = function (passport) {
//   passport.use(
//     new TwitterStrategy(
//       {
//         clientID: process.env.TWITTER_CLIENT_ID,
//         clientSecret: process.env.TWITTER_CLIENT_SECRET,
//         callbackURL: process.env.TWITTER_CALLBACK_URL,
//         scope: ['tweet.read', 'users.read', 'offline.access'],
//       },
//       async function (accessToken, refreshToken, profile, done) {
//         try {
//           let user = await User.findOne({ where: { twitterId: profile.id } });

//           if (!user) {
//             user = await User.create({
//               twitterId: profile.id,
//               name: profile.displayName,
//               email: profile.emails?.[0]?.value || null,
//             });
//           }

//           return done(null, user);
//         } catch (err) {
//           console.error("Twitter OAuth error:", err);
//           return done(err, null);
//         }
//       }
//     )
//   );
// };







// import { Strategy as TwitterStrategy } from "passport-twitter-oauth2";
// import passport from "passport";
// import User from "../models/User.js";

// passport.use(
//   new TwitterStrategy(
//     {
//       clientID: process.env.TWITTER_CLIENT_ID,
//       clientSecret: process.env.TWITTER_CLIENT_SECRET,
//       callbackURL: "https://anypay.cards/auth/twitter/callback",
//       scope: ["tweet.read", "users.read", "offline.access"],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ where: { twitterId: profile.id } });

//         if (!user) {
//           user = await User.create({
//             twitterId: profile.id,
//             username: profile.username,
//           });
//         }

//         return done(null, user);
//       } catch (err) {
//         return done(err, null);
//       }
//     }
//   )
// );

// export default passport;











