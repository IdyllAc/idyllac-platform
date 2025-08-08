// passport-jwt.js
// const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { User } = require('../models/User'); // Adjust path based on your structure

// Options for extracting JWT from Authorization header as Bearer token
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCESS_TOKEN_SECRET, //Secret used to sign the JWT. Make sure this is in your .env
};

// JWT strategy to authenticate user via token
module.exports = passport => {
    passport.use(
        new JwtStrategy(opts, async (jwt_payload, done) => {
            try {
                // Validate presence of userid in payload
                if (!jwt_payload.userid) {
                    console.warn('JWT payload does not contain userid');
                    return done(null, false);
                }

                // Find user from token payload
                const user = await User.findByPk(jwt_payload.userid);

                if (!user) {
                    return done(null, false); // No user found
                }

                // Optional: Add extra checks (e.g. email verification, ban status)
                if (user.is_banned || user.is_verified === false) {
                    return done(null, false); // User is restricted
                }

                // All good
                return done(null, user);
            } catch (error) {
                console.error('Error in Passport JWT Strategy:', error);
                return done(error, false);
            }
        })
    );
};



