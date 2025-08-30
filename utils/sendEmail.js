// utils/sendEmail.js
const nodemailer = require('nodemailer');

function normalizeBase(url) {
  return url ? url.replace(/\/+$/, '') : '';
}

const BASE_URL = normalizeBase(process.env.BASE_URL) || 'http://localhost:3000';

// Create transporter once (development)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: (process.env.SMTP_PORT || '465') === '465', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER, // e.g. your Gmail address
    pass: process.env.SMTP_PASS, // app password
  },
});

// Send a confirmation email GIVEN a token (helper builds the URL)
async function sendEmail(to, subject, token) {
  if (typeof token !== 'string' || token.length < 10) {
    throw new Error('sendEmail(token) must be a token string');
  }

  const confirmUrl = `${BASE_URL}/api/auth/confirm-email/${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: `Please confirm your email by clicking this link: ${confirmUrl}`,
    html: `
      <h2>Email Confirmation</h2>
      <p>Please confirm your email by clicking the button below:</p>
      <p>
        <a href="${confirmUrl}"
           style="padding:10px 15px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:5px;">
          Confirm Email
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${confirmUrl}">${confirmUrl}</a></p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Confirmation email sent to ${to} with subject "${subject}"`);
  console.log(`📩 Confirmation link: ${confirmUrl}`);
  console.log(`Message ID: ${info.messageId}`);
  return info;
}

module.exports = sendEmail;
