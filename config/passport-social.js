// /config/passport-social.js
const facebookStrategy = require('./passport-facebook');
const googleStrategy = require('./passport-google');
const githubStrategy = require('./passport-github');
const twitterStrategy = require('./passport-twitter');
const instagramStrategy = require('./passport-instagram');
const linkedinStrategy = require('./passport-linkedin');

function configureSocialStrategies(passport) {
  facebookStrategy(passport);
  googleStrategy(passport);
  githubStrategy(passport);
  twitterStrategy(passport);
  instagramStrategy(passport);
  linkedinStrategy(passport);
}

module.exports = configureSocialStrategies;
