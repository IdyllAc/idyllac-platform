// // test-email.js
// require("dotenv").config();
// const sendEmail = require("./utils/sendEmail");

// (async () => {
//   try {
//     await sendEmail("victor.via7@gmail.com", "Test Email", "1234567890TOKEN");
//     console.log("✅ Email test finished");
//   } catch (err) {
//     console.error("❌ Test failed:", err);
//   }
// })();

// test-email.js
const nodemailer = require('nodemailer');

function normalizeBase(url) {
  return url ? url.replace(/\/+$/, '') : '';
}

const BASE_URL = normalizeBase(process.env.BASE_URL) || 'http://localhost:3000';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

(async () => {
  try {
    const info = await transporter.sendMail({
      from: `"AnyPay Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // send to yourself
      subject: '✅ AnyPay Test Email',
      html: `
        <h2>Test Email from AnyPay</h2>
        <p>This is a dummy test email to verify SMTP configuration.</p>
        <p>BASE_URL: ${BASE_URL}</p>
      `,
    });
    console.log('✅ Test email sent:', info.messageId);
  } catch (err) {
    console.error('❌ Failed to send test email:', err);
  }
})();
