// config/passport-config.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { User } = require('../models');

function configureLocalStrategy(passport) {
  passport.use(
    new LocalStrategy({ 
      usernameField: 'email', 
      passwordField: 'password'
     }, async (email, password, done) => {
        try {
          console.log('🔍 LocalStrategy attempt - email:', email);

          const user = await User.findOne({ where: { email },
            attributes: ['id', 'email', 'password', 'isConfirmed'], // ✅ force include
          });

          if (!user) {
            console.warn('❌ No user found with email:', email);
            return done(null, false, { message: 'No user found with this email' }); // Invalid email or password
          }

          console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            isConfirmed: user.isConfirmed, // ✅ correct property
          });

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            console.warn('❌ Invalid password for user:', user.email);
            return done(null, false, { message: 'Incorrect password' }); // Invalid email or password
          }

          if (!user.isConfirmed) {
            console.warn('❌ User email not confirmed:', user.email);
            return done(null, false, { message: 'Please confirm your email before logging in' });
          }

          console.log('✅ Password valid, login success for:', user.email);
          return done(null, user);

        } catch (error) {
          console.error('🔥 Error in LocalStrategy:', error);
          return done(error);
        }
      }
    )
  );
}

module.exports = { configureLocalStrategy };
