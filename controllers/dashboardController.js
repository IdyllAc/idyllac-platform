// controllers/dashboardController.js
const models = require('../models');
const { User } = models;

// shared function (optional, you can keep or remove)
async function fetchDashboardData(userId) {
  return await User.findByPk(userId, { 
    attributes: ['id', 'name', 'email', 'isConfirmed'] 
  });
}

// For session (EJS)
exports.getDashboardPage = async (req, res) => {
  try {
     // ensure req.user exists (session-based)
     if (!req.user || !req.user.id) {
      req.flash('error', 'Not authenticated');
      return res.redirect('/login');
    }

     // Basic user info
    const userModel = await fetchDashboardData(req.user.id);
    if (!userModel) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    // Convert model -> plain object to avoid EJS issues
    const user = (userModel && typeof userModel.get === 'function')
      ? userModel.get({ plain: true })
      : userModel;

    // Prepare optional models checks (if these models exist)
    const PersonalInfo = models.PersonalInfo;
    const Document = models.Document;
    const Selfie = models.Selfie;

    let personal = null, document = null, selfie = null;
    try {
      if (PersonalInfo) personal = await PersonalInfo.findOne({ where: { userId: user.id } });
      if (Document) document = await Document.findOne({ where: { userId: user.id } });
      if (Selfie) selfie = await Selfie.findOne({ where: { userId: user.id } });
    } catch (err) {
      // if optional models/queries fail, just warn and continue
      console.warn('Dashboard optional model check failed:', err.message);
    }

     // Compute progress: 4 steps (email confirmed, personal info, documents, selfie)
     const steps = [
      !!user.isConfirmed,
      !!personal,
      !!document,
      !!selfie
    ];
    const completed = steps.filter(Boolean).length;
    const progress = Math.round((completed / steps.length) * 100);


    // // Flash welcome message (only shown once)
    //   req.flash('success', 'Welcome back!');

      // Render dashboard view — pass user, progress and any messages
      res.render('dashboard', {   // this triggers my /dashboard route
        user, // user: req.user || null,   // Passport user object
        progress,
        personalInfo: personal ? (personal.get ? personal.get({ plain: true }) : personal) : null,
        documents: document ? (document.get ? document.get({ plain: true }) : document) : null,
        selfie: selfie ? (selfie.get ? selfie.get({ plain: true }) : selfie) : null,
        messages: req.flash()     //  Flash messages if any
       }); 
       
  } catch (err) {
    console.error('Dashboard (EJS) error:', err);
    req.flash('error', 'Failed to load dashboard');
    return res.status(500).render('error', { message: 'Failed to load dashboard' });
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
