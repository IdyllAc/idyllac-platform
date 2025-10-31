// controllers/subscribeController.js
const { Subscriber, SocialUser } = require('../models');
const { Op } = require('sequelize');
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');

exports.subscribeEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let subscriber = await Subscriber.findOne({ where: { email } });
    if (!subscriber) {
      subscriber = await Subscriber.create({ email, verified: false });
    }

    // const token = crypto.randomBytes(32).toString('hex');
    // const verifyLink = `https://localhost:3000/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // // Example mail
    // console.log(`✅ Verification link for ${email}: ${verifyLink}`);

    // Here you could send a verification email
    console.log(`📧 Subscription request from: ${email}`);

    return res.json({ message: '✅ Subscription successful.', // Please verify your email.
      subscriber 
    });
  } catch (err) {
    console.error('❌ subscribeEmail error:', err);
    return res.status(500).json({ error: 'Failed to subscribe.' });
  }
};




