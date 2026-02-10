// src/utils/sendEmail.js
const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,      // your gmail
        pass: process.env.EMAIL_PASS,      // app password
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text }) => {
  try {
    const mailer = getTransporter();

    await mailer.sendMail({
      from: `"Finance Tracker" <${process.env.EMAIL_USER}>`,
      to,                    // ✅ ACTUAL LOGGED-IN USER EMAIL
      subject,
      text,
    });

    console.log("📧 Budget email sent to:", to);
  } catch (err) {
    console.error("❌ Email failed:", err.message);
    throw err;
  }
};

module.exports = sendEmail;
