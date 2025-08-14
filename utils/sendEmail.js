// utils/sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, token) => {
  try {
    const confirmUrl = `${process.env.BASE_URL}/api/auth/confirm-email/${token}`;

const transporter = nodemailer.createTransport({
  // service: 'gmail', 
  host: "smtp.gmail.com", // Use explicit Gmail SMTP host
  port: 465, // SSL port
  secure: true, // Use SSL
  auth: { 
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // App-specific password (not Gmail login password)
  },
});
 
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text:  `Please confirm your email by clicking this link: ${confirmUrl}`,
      html: `
        <h2>Email Confirmation</h2>
        <p>Please confirm your email by clicking the button below:</p>
        <p><a href="${confirmUrl}" style="padding:10px 15px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:5px;">Confirm Email</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${confirmUrl}</p>
     `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to ${to}`);
    console.log(`Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
