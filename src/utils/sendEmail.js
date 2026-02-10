// src/utils/sendEmail.js
const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // 🔥 REQUIRED on Render
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
      tls: {
        rejectUnauthorized: false, // 🔥 Render fix
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
      to,
      subject,
      text,
    });

    console.log("📧 Email sent successfully to:", to);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    // DO NOT throw — transaction should not rollback
  }
};

module.exports = sendEmail;
