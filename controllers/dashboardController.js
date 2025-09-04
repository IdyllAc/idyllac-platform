// controllers/dashboardController.js
const { User } = require('../models');

// shared function
async function fetchDashboardData(userId) {
  return await User.findByPk(userId, { attributes: ['id', 'name', 'email'] });
}

// For session (EJS)
exports.getDashboardPage = async (req, res) => {
  try {
    const user = await fetchDashboardData(req.user.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    // Flash welcome message (only shown once)
      req.flash('success', 'Welcome back!');

      // Render dashboard directly with user data and flash messages
      res.render('dashboard', { user, messages: req.flash() }); // this triggers my /dashboard route
  } catch (err) {
    console.error('Dashboard (EJS) error:', err);
    res.status(500).render('error', { message: 'Failed to load dashboard' });
  }
};

// For JWT API
exports.getDashboardApi = async (req, res) => {
  try {
    const user = await fetchDashboardData(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ 
      message: 'Welcome to your dashboard',
      user: {
        id: user.id,
        name: user.name || user.username,
        email: user.email,
      }
    });
    // res.json({ message: 'Welcome to JWT Dashboard', user });
  } catch (err) {
    console.error('Dashboard (API) error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
