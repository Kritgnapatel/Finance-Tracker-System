// src/utils/sendEmail.js
const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
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

    console.log("📧 Email sent to:", to);
  } catch (err) {
    // 🔥 DO NOT throw — background failure allowed
    console.error("❌ Email send failed:", err.message);
  }
};

module.exports = sendEmail;
