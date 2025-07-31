// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendConfirmationEmail = async (email, token) => {
  try {
    const confirmationUrl = `${process.env.BASE_URL}/auth/confirm-email/${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"IdyllAc" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Confirm your email',
      html: `<p>Please confirm your email:</p><a href="${confirmationUrl}">${confirmationUrl}</a>`,
    });

    console.log('✅ Email sent:', info.messageId);
  } catch (err) {
    console.error('❌ Error sending confirmation email:', err);
  }
};

module.exports = sendConfirmationEmail;
