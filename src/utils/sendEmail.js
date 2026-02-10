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
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text }) => {
  try {
    if (!to) {
      console.error("❌ Email skipped: recipient missing");
      return;
    }

    const mailer = getTransporter();

    await mailer.verify();
    console.log("✅ SMTP verified");

    const info = await mailer.sendMail({
      from: `"Finance Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("📧 Email sent:", {
      to,
      messageId: info.messageId,
    });
  } catch (err) {
    // ❗ NEVER throw — budget logic should not break transaction
    console.error("❌ Email send failed:", err.message);
  }
};

module.exports = sendEmail;
