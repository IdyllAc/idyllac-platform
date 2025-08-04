// controllers/authController.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User } = require('../models');
const { sendConfirmationEmail } = require('../utils/sendEmail'); // ✅ Import it

// GET /register
exports.getRegister = (req, res) => {
  res.render('register');
};

// POST /register
exports.postRegister = async (req, res) => {
  try {
    const { name, email, cemail, password } = req.body;

    if (email !== cemail) {
      return res.status(400).send("Emails do not match.");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationToken = crypto.randomBytes(20).toString('hex');

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isConfirmed: false,
      confirmationToken,
    });

    // ✅ Send confirmation email
       console.log("Preparing to send confirmation email...");

       await sendConfirmationEmail(newUser.email, confirmationToken);

       console.log("Confirmation email sent (or attempted).");
       console.log("EMAIL_USER:", process.env.EMAIL_USER);


    req.flash('info', 'Confirmation email sent. Check your inbox.');
    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    res.redirect('/register');
  }
};

// GET /login
exports.getLogin = (req, res) => {
  res.render('login');
};

// DELETE /logout
exports.logout = (req, res, next) => {
  req.logOut(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
};
