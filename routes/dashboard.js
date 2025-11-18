// routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { checkAuthenticated } = require('../middleware/authMiddleware'); // Adjust path as needed
const noCache = require('../middleware/noCache');

// EJS session (passport) dashboard 
router.get('/dashboard', checkAuthenticated, noCache, dashboardController.getDashboardPage);

// // Dashboard page
// router.get("/dashboard", (req, res) => {
//   res.render("dashboard", {   // views/dashboard.ejs
//     user: req.user,
//   progress: 0  // 👈 default value (or compute dynamically)
//    }); 
// });


// // NEW: session-protected JSON endpoint (for clients using session cookie)
// router.get('/session', checkAuthenticated, noCache, dashboardController.getDashboardApi);

// // ✅ Return user data if authenticated by session
// router.get('/session', (req, res) => {
//     if (req.isAuthenticated && req.isAuthenticated()) {
//       console.log("📦 /api/auth/session →", req.user.email);
//       return res.json({ user: req.user });
//     }
//     res.status(401).json({ error: 'Not authenticated (no session)' });
//   });
  



module.exports = router;
