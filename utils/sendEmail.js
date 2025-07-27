// utils/sendEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service (e.g., SMTP)
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP__PASS
  }
});

const sendConfirmationEmail = async (email, token) => {
  const confirmUrl = `https://anypay.cards/auth/confirm-email/${token}`; 
 

  const message = `
    <h2>Confirm Your Email</h2>
    <p>Click the link below to confirm your email address:</p>
    <a href="${confirmUrl}">${confirmUrl}</a>
  `;

  await transporter.sendMail({
    from: `"Idyllac anypay" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Confirm Your Email',
    html: message
  });

  console.log(`Confirmation email sent to ${email}`);
};

module.exports = sendConfirmationEmail;
