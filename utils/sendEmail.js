// utils/sendEmail.js
const nodemailer = require("nodemailer");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASS, // App password
      },
    });


    exports.sendConfirmationEmail = async function(email, token) {
      const confirmUrl = `${process.env.BASE_URL}/confirm-email/${token}`;
      const mailOptions = {
      from: `"No Reply" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Confirm your email',
      html:`
      <h3>Email Confirmation</h3>
      <p>Please click the link below to confirm your email:</p>
      <a href="${confirmUrl}">${confirmUrl}</a>
    `,
    };

    try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to ${email}`);
  } catch (err) {
    console.error('❌ Email sending failed:', err);
    throw err;
  }
};