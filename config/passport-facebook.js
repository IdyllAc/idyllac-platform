// config/passport-facebook.js
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { SocialUser } = require('../models');

module.exports = (passport) => {
  if (!process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
    console.warn('⚠️ Skipping Facebook OAuth: missing FACEBOOK_CLIENT_ID or FACEBOOK_CLIENT_SECRET');
    return;
  }

  console.log('✅ Facebook OAuth strategy loaded');

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'photos'], // important for getting name/email
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || `${profile.id}@facebook.temp`;
          const avatar = profile.photos?.[0]?.value || null;
          const fullName = `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || profile.displayName || null;

          const [user] = await SocialUser.findOrCreate({
            where: { provider_id: profile.id },
            defaults: {
              provider: 'facebook',
              name: fullName,
              email,
              avatar_url: avatar,
              isConfirmed: true, // trust Facebook OAuth verified identity
            },
          });

          return done(null, user);
        } catch (err) {
          console.error('❌ Facebook OAuth error:', err);
          return done(err, null);
        }
      }
    )
  );
};
