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

    console.log("Preparing to send confirmation email...");

    // Construct confirmation URL
    // Ensure BASE_URL is set in your environment variables
    if (!process.env.BASE_URL) {
      console.error("BASE_URL environment variable is not set.");
      req.flash('error', 'Server configuration error. Please try again later.');
      return res.redirect('/register');
    }
    
    // Use the confirmation token to create a URL for email confirmation

    const confirmationUrl = `${process.env.BASE_URL}/auth/confirm-email/${confirmationToken}`;
    try {
    // ✅ Send confirmation email
        console.log("Sending confirmation email to:", newUser.email);
       await sendConfirmationEmail(newUser.email, confirmationToken);

       console.log("Confirmation email sent (or attempted).");
       console.log("EMAIL_USER:", process.env.EMAIL_USER);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      req.flash('error', 'Failed to send confirmation email. Please try again later.');
      return res.redirect('/register');
    }

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
