// config/passport-google.js
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Skipping Google OAuth: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    return;
  }

  console.log('✅ Google OAuth strategy loaded');

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/google/callback`, // use full URL in prod

        // 👇 Add this line here for YouTube data access:
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || null;
          const avatar = profile.photos?.[0]?.value || null;

          const [user] = await SocialUser.findOrCreate({
            where: { provider_id: profile.id },
            defaults: {
              provider: 'google',
              name: profile.displayName || profile.name?.givenName || null,
              email,
              avatar_url: avatar,
              isConfirmed: true, // mark OAuth users as confirmed automatically
            },
          });

          return done(null, user);
        } catch (err) {
          console.error('❌ Google OAuth error:', err);
          return done(err, null);
        }
      }
    )
  );
};
