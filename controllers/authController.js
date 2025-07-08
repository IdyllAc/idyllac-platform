// controllers/authController.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User } = require('../models');

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

    await User.create({
      name,
      email,
      password: hashedPassword,
      isConfirmed: false,
      confirmationToken,
    });

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
