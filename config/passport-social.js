// /config/passport-social.js

function configureSocialStrategies(passport) {
  // Dynamically load each provider config
  require('./passport-facebook')(passport);
  require('./passport-google')(passport);
  require('./passport-github')(passport);
  require('./passport-twitter')(passport);
  require('./passport-instagram')(passport);
  require('./passport-linkedin')(passport);
}

// ✅ Export as an object (so passport.js can destructure it)
module.exports = { configureSocialStrategies };
