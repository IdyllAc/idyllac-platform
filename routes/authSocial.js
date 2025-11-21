// routes/authSocial.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// ✅ FACEBOOK
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/subscribe.html', session: false }),
  (req, res) => res.redirect('/default')
);

// ✅ GOOGLE
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/subscribe.html', session: false }),
  (req, res) => res.redirect('/default')
);

// ✅ GITHUB
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/subscribe.html', session: false }),
  (req, res) => res.redirect('/default')
);

// ✅ TWITTER LOGIN
router.get('/twitter', passport.authenticate('twitter'));
router.get(
  '/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/subscribe.html', session: false }),
  (req, res) => {
    // Twitter OAuth successful
    // req.user contains the SocialUser record

    console.log("🐦 Twitter login success:", req.user?.email || req.user?.id);

    // Redirect to dashboard or your unified login success page
    return res.redirect('/default');
  }
);

// ✅ LINKEDIN
router.get('/linkedin', passport.authenticate('linkedin', { scope: ['r_emailaddress', 'r_liteprofile'] }));
router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/subscribe.html', session: false }),
  (req, res) => res.redirect('/default')
);

// ✅ INSTAGRAM
router.get('/instagram', passport.authenticate('instagram'));
router.get(
  '/instagram/callback',
  passport.authenticate('instagram', { failureRedirect: '/subscribe.html', session: false }),
  (req, res) => res.redirect('/default')
);

module.exports = router;
