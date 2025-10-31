// routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { checkAuthenticated } = require('../middleware/authMiddleware'); // Adjust path as needed

// EJS session (passport) dashboard 
router.get('/', checkAuthenticated, dashboardController.getDashboardPage);

module.exports = router;
