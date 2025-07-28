// utils/sendEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service (e.g., SMTP)
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a confirmation email to the user.
 * @param {string} email - The user's email address.
 * @param {string} token - The unique confirmation token.
 */
const sendConfirmationEmail = async (email, token) => {
  const confirmUrl = `${process.env.BASE_URL}/auth/confirm-email/${token}`; 
 
  const message = `
    <h2>Confirm Your Email</h2>
    <p>Click the link below to confirm your email address:</p>
    <a href="${confirmUrl}">${confirmUrl}</a>
  `;

  // // Check if the email is valid
  // if (!email || !/\S+@\S+\.\S+/.test(email)) {
  //   throw new Error('Invalid email address');
  // }

  try { 
    await transporter.sendMail({
      from: `"IdyllAc for anypay" <${process.env.SMTP_EMAIL}>`,
      to: user.email,
      subject: 'Please confirm Your Email',
      html: `<p>Hello ${user.name},</p>
             <p>Click <a href="${process.env.BASE_URL}/auth/confirm-email/${confirmationToken}">here</a> to confirm your email.</p>`,
    });

    console.log(`✅ Confirmation email sent to ${email}`);
    // console.log(`➡️ Confirmation URL: ${confirmUrl}`);
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error);
  }
};

module.exports = sendConfirmationEmail;
