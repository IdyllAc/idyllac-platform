// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Use explicit Gmail SMTP host
  port: 465, // SSL port
  secure: true, // Use SSL
  auth: { 
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // App-specific password (not Gmail login password)
  },
});

exports.sendConfirmationEmail = async function(email, token) {
  try {
    if (!process.env.BASE_URL) {
      throw new Error("❌ BASE_URL is not set in environment variables");
    }

    const confirmUrl = `${process.env.BASE_URL}/confirm-email/${token}`;

    const mailOptions = {
      from: `"No Reply" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Confirm your email",
      html: `
        <h3>Email Confirmation</h3>
        <p>Please click the link below to confirm your email:</p>
        <a href="${confirmUrl}" target="_blank">${confirmUrl}</a>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to ${email}`);
    console.log("Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw err;
  }
};
