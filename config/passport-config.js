// config/passport-config.js
const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../models');
const bcrypt = require('bcrypt');


function configureLocalStrategy(passport, getUserByEmail, getUserById) {
    passport.use( new LocalStrategy({ 
        usernameField: 'email',
    }, async (email, password, done) => {
        try {
            // Check if user exists
           const user = await User.findOne({ where: { email } });
            if (!user) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            // Check password
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect' });
            }
        }
        catch (err) {
            return done(err);
        }
       
    }));
}

module.exports = {configureLocalStrategy };
