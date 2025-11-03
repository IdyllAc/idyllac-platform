// /config/passport-social.js
const facebookStrategy = require('./passport-facebook');
const googleStrategy = require('./passport-google');
const githubStrategy = require('./passport-github');
const twitterStrategy = require('./passport-twitter');
const instagramStrategy = require('./passport-instagram');
const linkedinStrategy = require('./passport-linkedin');

function configureSocialStrategies(passport) {
  require('./passport-facebook')(passport);
  require('./passport-google')(passport);
  require('./passport-github')(passport);
  require('./passport-twitter')(passport);
  require('./passport-instagram')(passport);
  require('./passport-linkedin')(passport);
}

module.exports = { configureSocialStrategies };
