// utils/sendEmail.js
require("dotenv").config();
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

function normalizeBase(url) {
  return url ? url.replace(/\/+$/, "") : "";
}

const BASE_URL = normalizeBase(process.env.BASE_URL) || "http://localhost:3000";
const ENV = process.env.NODE_ENV || "development";

// Detect provider automatically
const USE_SENDGRID = ENV === "production" && !!process.env.SENDGRID_API_KEY;

let transporter = null;

// ✅ If SendGrid API Key exists and in production — use SendGrid
if (USE_SENDGRID) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("📨 Using SendGrid for email delivery");
} else {
  // ✅ Otherwise, fall back to local SMTP (Gmail or similar)
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log("📨 Using local SMTP (Nodemailer)");
}

// ✅ Universal send function (works with both systems)
async function sendEmail(to, subject, token) {
  if (!to || !subject) {
    throw new Error("sendEmail() requires 'to' and 'subject'");

  }

  if (typeof token !== "string" || token.length < 10) {
    throw new Error("sendEmail(token) must be a valid token string");
  }

  const confirmUrl = `${BASE_URL}/api/auth/confirm-email/${token}`;

  const html = `
    <h2>Email Confirmation</h2>
    <p>Please confirm your email by clicking the button below:</p>
    <p>
      <a href="${confirmUrl}"
         style="padding:10px 15px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:5px;">
        Confirm Email
      </a>
    </p>
    <p>If the button doesn’t work, copy and paste this link:</p>
    <p><a href="${confirmUrl}">${confirmUrl}</a></p>
  `;

  console.log(`📧 Preparing to send email:
    To: ${to}
    Provider: ${USE_SENDGRID ? "SendGrid" : "SMTP"}
    BASE_URL: ${BASE_URL}
  `);

  try {
    if (USE_SENDGRID) {
      await sgMail.send({
        to,
        from: process.env.SMTP_FROM || "no-reply@anypay.cards",
        subject,
        html,
        text: `Please confirm your email by visiting: ${confirmUrl}`,
      });
      console.log(`✅ Email sent via SendGrid to ${to}`);
    } else {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"AnyPay" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: `Please confirm your email by visiting: ${confirmUrl}`,
      });
      console.log(`✅ Email sent via SMTP to ${to} (${info.messageId})`);
    }

    console.log(`📩 Confirmation link: ${confirmUrl}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err.response?.body || err.message);
    throw err;
  }
}

module.exports = sendEmail;



// // utils/sendEmail.js
// const nodemailer = require("nodemailer");

// function normalizeBase(url) {
//   return url ? url.replace(/\/+$/, "") : "";
// }

// const BASE_URL = normalizeBase(process.env.BASE_URL) || "http://localhost:3000";

// // Create reusable transporter (auto-detect secure mode from port)
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || "smtp.gmail.com",
//   port: parseInt(process.env.SMTP_PORT || "465", 10),
//   secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "587", // true for 465, false for 587
//   auth: {
//     user: process.env.SMTP_USER, // Gmail address
//     pass: process.env.SMTP_PASS, // App Password
//   },
// });

// // Send a confirmation email GIVEN a token (helper builds the URL)
// async function sendEmail(to, subject, token) {
//   if (!to || !subject) {
//     throw new Error("sendEmail() requires 'to' and 'subject'");
//   }

//   if (typeof token !== "string" || token.length < 10) {
//     throw new Error("sendEmail(token) must be a valid token string");
//   }

//   const confirmUrl = `${BASE_URL}/api/auth/confirm-email/${token}`;

//   const mailOptions = {
//     from: process.env.SMTP_FROM || `"AnyPay" <${process.env.SMTP_USER}>`,
//     to,
//     subject,
//     text: `Please confirm your email by clicking this link: ${confirmUrl}`,
//     html: `
//       <h2>Email Confirmation</h2>
//       <p>Please confirm your email by clicking the button below:</p>
//       <p>
//         <a href="${confirmUrl}"
//            style="padding:10px 15px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:5px;">
//           Confirm Email
//         </a>
//       </p>
//       <p>If the button doesn’t work, copy and paste this link:</p>
//       <p><a href="${confirmUrl}">${confirmUrl}</a></p>
//     `,
//   };

//   console.log(`📧 Preparing to send email:
//     To: ${to}
//     SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}
//     Secure: ${process.env.SMTP_SECURE}
//     BASE_URL: ${BASE_URL}
//   `);
  
//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log(`✅ Email sent to ${to} ${info.messageId}`);
//     console.log(`📩 Confirmation link: ${confirmUrl}`);
//     return info;
//   } catch (err) {
//     console.error("❌ Email sending failed:", err.message);
//     throw err;
//   }
// }

// module.exports = sendEmail;




