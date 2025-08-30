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
      req.flash('error', 'User not found??');
      return res.redirect('/login');
    }
   res.render('/dashboard/page', { user: req.user });
  } catch (err) {
    console.error('Dashboard (EJS) error:', err);
    res.status(500).render('error', { message: 'Failed to load dashboard' });
  }
};

// For JWT API
exports.getDashboardApi = async (req, res) => {
  try {
    const user = await fetchDashboardData(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found!!' });

    res.json({ 
      message: 'Welcome to your dashboard',
      user: {
        id: req.user.id,
        name: req.user.name || req.user.username,
        email: req.user.email,
      }
    });
    
    // res.json({ message: 'Welcome to JWT Dashboard', user });
  } catch (err) {
    console.error('Dashboard (API) error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
