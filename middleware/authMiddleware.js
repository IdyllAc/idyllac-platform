// middleware/authMiddleware.js
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return res.redirect('/dashboard');
    next();
  }


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {   // Passport adds this method
      return next();
    }
    res.redirect('/login');  // or res.status(401).json({ error: 'Unauthorized' });
  }
  
  module.exports = { checkNotAuthenticated,  checkAuthenticated };
  